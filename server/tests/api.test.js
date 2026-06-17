import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { closeDatabaseConnection, connectToDatabase, getCollections } from "../src/lib/db.js";
import { loadSeedDataFromFiles } from "../src/lib/file-seed.js";

let mongoServer;

async function resetDatabase() {
  const collections = getCollections();
  await Promise.all([
    collections.users.deleteMany({}),
    collections.factions.deleteMany({}),
    collections.roles.deleteMany({}),
    collections.missions.deleteMany({}),
    collections.evaluations.deleteMany({}),
    collections.individualEvaluations.deleteMany({}),
    collections.campMaps.deleteMany({}),
    collections.mapLocations.deleteMany({}),
    collections.settings.deleteMany({})
  ]);

  const seed = await loadSeedDataFromFiles();
  await collections.users.insertMany(seed.users);
  await collections.factions.insertMany(seed.factions);
  await collections.roles.insertMany(seed.roles);
  await collections.missions.insertMany(seed.missions);
  await collections.campMaps.insertOne(seed.campMap);
  await collections.mapLocations.insertMany(seed.mapLocations);
  await collections.settings.insertOne({ id: "app-settings", ...seed.settings });
}

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.MONGODB_DB_NAME = "last-outpost-test";
  await connectToDatabase();
});

test.beforeEach(async () => {
  await resetDatabase();
});

test.after(async () => {
  await closeDatabaseConnection();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test("leader auth supports seeded leader accounts", async () => {
  const app = createApp();
  const response = await request(app)
    .post("/api/auth/leader")
    .send({ username: "commander", password: "rebuild2200" });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, "leader");
  assert.equal(response.body.user.password, undefined);
});

test("rover signup creates an unassigned rover", async () => {
  const app = createApp();
  const response = await request(app)
    .post("/api/rovers/signup")
    .send({
      fullName: "Test Rover",
      nickname: "Scout",
      password: "1234",
      confirmPassword: "1234"
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.role, "rover");
  assert.equal(response.body.user.status, "unassigned");
  assert.equal(response.body.user.factionId, null);
});

test("leaders can assign rover faction and role", async () => {
  const collections = getCollections();
  await collections.users.insertOne({
    id: "rover-test",
    fullName: "Test Rover",
    fullNameKey: "test rover",
    nickname: "",
    nicknameKey: "",
    password: "1234",
    displayName: "Test Rover",
    role: "rover",
    status: "unassigned",
    factionId: null,
    assignedRole: null
  });

  const app = createApp();
  const response = await request(app)
    .patch("/api/rovers/rover-test/assignment")
    .send({ factionId: "wardens", assignedRole: "engineer" });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.status, "assigned");
  assert.equal(response.body.user.factionId, "wardens");
  assert.equal(response.body.user.assignedRole, "engineer");
});

test("leader assignment blocks duplicate roles inside one faction", async () => {
  const collections = getCollections();
  await collections.users.insertMany([
    {
      id: "rover-engineer",
      fullName: "Assigned Engineer",
      fullNameKey: "assigned engineer",
      nickname: "",
      nicknameKey: "",
      password: "1234",
      displayName: "Assigned Engineer",
      role: "rover",
      status: "assigned",
      factionId: "wardens",
      assignedRole: "engineer"
    },
    {
      id: "rover-candidate",
      fullName: "Candidate Rover",
      fullNameKey: "candidate rover",
      nickname: "",
      nicknameKey: "",
      password: "1234",
      displayName: "Candidate Rover",
      role: "rover",
      status: "unassigned",
      factionId: null,
      assignedRole: null
    }
  ]);

  const app = createApp();
  const response = await request(app)
    .patch("/api/rovers/rover-candidate/assignment")
    .send({ factionId: "wardens", assignedRole: "engineer" });

  assert.equal(response.status, 409);
  assert.match(response.body.message, /already holds this role/);
});

test("leader assignment warns when faction exceeds five rovers", async () => {
  const collections = getCollections();
  await collections.users.insertMany(
    Array.from({ length: 5 }, (_, index) => ({
      id: `wardens-rover-${index}`,
      fullName: `Wardens Rover ${index}`,
      fullNameKey: `wardens rover ${index}`,
      nickname: "",
      nicknameKey: "",
      password: "1234",
      displayName: `Wardens Rover ${index}`,
      role: "rover",
      status: "assigned",
      factionId: "wardens",
      assignedRole: null
    })).concat({
      id: "extra-rover",
      fullName: "Extra Rover",
      fullNameKey: "extra rover",
      nickname: "",
      nicknameKey: "",
      password: "1234",
      displayName: "Extra Rover",
      role: "rover",
      status: "unassigned",
      factionId: null,
      assignedRole: null
    })
  );

  const app = createApp();
  const response = await request(app)
    .patch("/api/rovers/extra-rover/assignment")
    .send({ factionId: "wardens", assignedRole: null });

  assert.equal(response.status, 200);
  assert.equal(response.body.warning, "This faction now has more than 5 Rovers.");
});

test("evaluation scores are saved and totaled out of 100", async () => {
  const app = createApp();
  const response = await request(app)
    .post("/api/evaluations")
    .send({
      day: "Day 1",
      factionId: "foragers",
      survivalSkill: 18,
      security: 17,
      resources: 16,
      morale: 19,
      humanity: 20,
      notes: "Balanced work.",
      breachAlerts: ["Lateness"],
      repairMissions: ["Lead the next formation"]
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.evaluation.total, 90);

  const summary = await request(app).get("/api/evaluations");
  assert.equal(summary.body.cumulative.find((entry) => entry.faction.id === "foragers").total, 90);
});

test("individual rover evaluations are saved and visible read-only", async () => {
  const collections = getCollections();
  await collections.users.insertOne({
    id: "rover-individual",
    fullName: "Individual Rover",
    fullNameKey: "individual rover",
    nickname: "",
    nicknameKey: "",
    password: "1234",
    displayName: "Individual Rover",
    role: "rover",
    status: "assigned",
    factionId: "foragers",
    assignedRole: "scout-radio-operator"
  });

  const app = createApp();
  const response = await request(app)
    .post("/api/individual-evaluations")
    .send({
      day: "Day 2",
      roverId: "rover-individual",
      readiness: 16,
      discipline: 17,
      resourcefulness: 18,
      teamwork: 19,
      humanity: 20,
      notes: "Strong recovery under pressure.",
      growthMission: "Support the next formation."
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.evaluation.total, 90);

  const summary = await request(app).get("/api/individual-evaluations");
  const saved = summary.body.rows.find((row) => row.roverId === "rover-individual");
  assert.equal(saved.total, 90);
  assert.equal(saved.rover.faction.name, "The Foragers");
  assert.equal(saved.rover.roleInfo.name, "Scout / Radio Operator");
});

test("camp map returns visible rover-safe markers", async () => {
  const app = createApp();
  const response = await request(app).get("/api/camp-map");

  assert.equal(response.status, 200);
  assert.equal(response.body.map.title, "The Last Outpost Blueprint");
  assert.ok(response.body.locations.some((location) => location.id === "meeting-room"));
  assert.ok(response.body.locations.every((location) => location.isVisible));
  assert.ok(response.body.locations.every((location) => !location.leaderOnly));
});

test("leaders can update map marker coordinates", async () => {
  const app = createApp();
  const response = await request(app)
    .put("/api/camp-map/locations/fire-pit")
    .send({
      name: "Fire Pit",
      description: "Updated fire circle.",
      category: "Gathering Zone",
      xPosition: 52.5,
      yPosition: 49.5,
      accessLevel: "All participants during scheduled sessions",
      safetyNote: "Leader supervision required.",
      isVisible: true,
      leaderOnly: false
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.location.xPosition, 52.5);
  assert.equal(response.body.location.yPosition, 49.5);
  assert.equal(response.body.location.safetyNote, "Leader supervision required.");
});
