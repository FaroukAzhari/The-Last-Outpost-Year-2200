import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../src/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");

async function readJson(name) {
  return JSON.parse(await fs.readFile(path.join(dataDir, name), "utf8"));
}

async function writeJson(name, data) {
  await fs.writeFile(path.join(dataDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const seedState = {};

test.before(async () => {
  for (const name of ["crews.json", "evaluations.json", "settings.json"]) {
    seedState[name] = await readJson(name);
  }
});

test.afterEach(async () => {
  for (const [name, data] of Object.entries(seedState)) {
    await writeJson(name, data);
  }
});

test("GET /api/crews returns computed scores", async () => {
  const app = createApp();
  const response = await request(app).get("/api/crews");

  assert.equal(response.status, 200);
  assert.equal(response.body.length, 4);
  assert.equal(response.body[0].totalScore, 63);
  assert.equal(response.body[0].gateStabilityLevel, "Critical");
});

test("mission submission accepts normalized answers and persists completion", async () => {
  const app = createApp();
  const response = await request(app)
    .post("/api/missions/the-first-transmission/submit")
    .send({ crewId: "signalers", answer: "  havenwood  " });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, "ACCESS GRANTED");

  const crews = await readJson("crews.json");
  const signalers = crews.find((crew) => crew.id === "signalers");
  assert.ok(signalers.completedMissionIds.includes("the-first-transmission"));
});

test("leader updates shadow marks and recalculates crew score", async () => {
  const app = createApp();
  const response = await request(app)
    .post("/api/crews/lanterns/shadow")
    .send({ delta: 1 });

  assert.equal(response.status, 200);
  assert.equal(response.body.shadowMarks, 1);
  assert.equal(response.body.totalScore, 68);
});

test("reports respect manual most improved selection", async () => {
  const app = createApp();

  await request(app)
    .post("/api/reports/most-improved")
    .send({ memberId: "jana-trackers" })
    .expect(200);

  const report = await request(app).get("/api/reports");
  assert.equal(report.status, 200);
  assert.equal(report.body.mostImproved.id, "jana-trackers");
});
