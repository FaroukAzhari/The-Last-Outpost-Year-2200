import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { getCollections } from "./lib/db.js";

const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4"];
const EVALUATION_FIELDS = ["survivalSkill", "security", "resources", "morale", "humanity"];
const INDIVIDUAL_FIELDS = ["readiness", "discipline", "resourcefulness", "teamwork", "humanity"];
const MAP_CATEGORIES = [
  "Safe Zone",
  "Command Zone",
  "Activity Zone",
  "Research Zone",
  "Service Zone",
  "Emergency Zone",
  "Restricted Access",
  "Restricted Boundary",
  "Access Point",
  "Gathering Zone"
];
const BREACH_REASONS = [
  "Lateness",
  "Unsafe behavior",
  "Disrespect",
  "Cheating",
  "Selfish behavior",
  "Poor cleanliness",
  "Wasting resources",
  "Leaving a member behind",
  "Ignoring leader instructions",
  "Breaking night mission boundaries"
];

function sanitizeMongoDocument(document) {
  if (!document) {
    return document;
  }

  const { _id, password, ...rest } = document;
  return rest;
}

function sanitizeWithPassword(document) {
  if (!document) {
    return document;
  }

  const { _id, ...rest } = document;
  return rest;
}

function makeId(prefix, value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${prefix}-${slug || crypto.randomUUID().slice(0, 8)}`;
}

function getEvaluationTotal(evaluation) {
  return EVALUATION_FIELDS.reduce((sum, field) => sum + Number(evaluation[field] || 0), 0);
}

function validateScore(value) {
  return Number.isFinite(value) && value >= 0 && value <= 20;
}

function getIndividualTotal(evaluation) {
  return INDIVIDUAL_FIELDS.reduce((sum, field) => sum + Number(evaluation[field] || 0), 0);
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 50;
  }

  return Math.max(0, Math.min(100, number));
}

async function getSettings() {
  return sanitizeMongoDocument(await getCollections().settings.findOne({ id: "app-settings" }));
}

async function getFactionsWithMembers() {
  const collections = getCollections();
  const [factions, rovers, roles] = await Promise.all([
    collections.factions.find({}).toArray(),
    collections.users.find({ role: "rover" }).sort({ fullName: 1 }).toArray(),
    collections.roles.find({}).toArray()
  ]);

  return factions.map(sanitizeMongoDocument).map((faction) => ({
    ...faction,
    members: rovers
      .map(sanitizeMongoDocument)
      .filter((rover) => rover.factionId === faction.id),
    memberCount: rovers.filter((rover) => rover.factionId === faction.id).length,
    roles: roles.map(sanitizeMongoDocument).map((role) => ({
      ...role,
      assignedRover: sanitizeMongoDocument(rovers.find((rover) => (
        rover.factionId === faction.id && rover.assignedRole === role.id
      ))) ?? null
    }))
  }));
}

async function getEvaluationSummary() {
  const collections = getCollections();
  const [evaluations, factions] = await Promise.all([
    collections.evaluations.find({}).sort({ day: 1, factionId: 1 }).toArray(),
    collections.factions.find({}).toArray()
  ]);
  const factionsById = new Map(factions.map((faction) => [faction.id, sanitizeMongoDocument(faction)]));

  const rows = evaluations.map(sanitizeMongoDocument).map((evaluation) => ({
    ...evaluation,
    faction: factionsById.get(evaluation.factionId) ?? null,
    total: getEvaluationTotal(evaluation)
  }));

  const cumulative = factions.map(sanitizeMongoDocument).map((faction) => {
    const factionRows = rows.filter((evaluation) => evaluation.factionId === faction.id);
    return {
      faction,
      total: factionRows.reduce((sum, evaluation) => sum + evaluation.total, 0),
      days: DAYS.map((day) => factionRows.find((evaluation) => evaluation.day === day) ?? null)
    };
  });

  return { rows, cumulative };
}

async function getIndividualEvaluationSummary() {
  const collections = getCollections();
  const [evaluations, rovers, factions, roles] = await Promise.all([
    collections.individualEvaluations.find({}).sort({ day: 1, roverId: 1 }).toArray(),
    collections.users.find({ role: "rover" }).sort({ fullName: 1 }).toArray(),
    collections.factions.find({}).toArray(),
    collections.roles.find({}).toArray()
  ]);
  const roversById = new Map(rovers.map((rover) => [rover.id, sanitizeMongoDocument(rover)]));
  const factionsById = new Map(factions.map((faction) => [faction.id, sanitizeMongoDocument(faction)]));
  const rolesById = new Map(roles.map((role) => [role.id, sanitizeMongoDocument(role)]));

  const rows = evaluations.map(sanitizeMongoDocument).map((evaluation) => {
    const rover = roversById.get(evaluation.roverId);

    return {
      ...evaluation,
      total: getIndividualTotal(evaluation),
      rover: rover
        ? {
          ...rover,
          faction: factionsById.get(rover.factionId) ?? null,
          roleInfo: rolesById.get(rover.assignedRole) ?? null
        }
        : null
    };
  });

  const cumulative = [...roversById.values()].map((rover) => {
    const roverRows = rows.filter((evaluation) => evaluation.roverId === rover.id);

    return {
      rover: {
        ...rover,
        faction: factionsById.get(rover.factionId) ?? null,
        roleInfo: rolesById.get(rover.assignedRole) ?? null
      },
      total: roverRows.reduce((sum, evaluation) => sum + evaluation.total, 0),
      days: DAYS.map((day) => roverRows.find((evaluation) => evaluation.day === day) ?? null)
    };
  });

  return { rows, cumulative };
}

async function getCampMapPayload({ includeHidden = false, includeLeaderOnly = false } = {}) {
  const collections = getCollections();
  const [map, locations] = await Promise.all([
    collections.campMaps.findOne({ id: "last-outpost-blueprint" }),
    collections.mapLocations.find({}).sort({ name: 1 }).toArray()
  ]);

  return {
    map: sanitizeMongoDocument(map),
    locations: locations
      .map(sanitizeMongoDocument)
      .filter((location) => includeHidden || location.isVisible)
      .filter((location) => includeLeaderOnly || !location.leaderOnly)
  };
}

function normalizeMapLocation(body, existing = {}) {
  const now = new Date().toISOString();
  const name = String(body?.name ?? existing.name ?? "").trim();
  const category = MAP_CATEGORIES.includes(body?.category) ? body.category : existing.category || "Activity Zone";

  return {
    id: existing.id || makeId("map", name),
    name,
    description: String(body?.description ?? existing.description ?? "").trim(),
    category,
    xPosition: clampPercent(body?.xPosition ?? existing.xPosition),
    yPosition: clampPercent(body?.yPosition ?? existing.yPosition),
    accessLevel: String(body?.accessLevel ?? existing.accessLevel ?? "All participants").trim(),
    safetyNote: String(body?.safetyNote ?? existing.safetyNote ?? "").trim(),
    isVisible: Boolean(body?.isVisible ?? existing.isVisible ?? true),
    leaderOnly: Boolean(body?.leaderOnly ?? existing.leaderOnly ?? false),
    relatedSession: String(body?.relatedSession ?? existing.relatedSession ?? "").trim(),
    updatedAt: now
  };
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "12mb" }));

  app.get("/", (_req, res) => {
    res.json({
      service: "The Last Outpost API",
      status: "online",
      docs: {
        publicSettings: "/api/settings/public",
        campMap: "/api/camp-map"
      }
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/settings/public", async (_req, res, next) => {
    try {
      const settings = await getSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/leader", async (req, res, next) => {
    try {
      const username = String(req.body?.username ?? "").trim().toLowerCase();
      const password = String(req.body?.password ?? "");
      const user = sanitizeWithPassword(await getCollections().users.findOne({ username, role: "leader" }));

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Access denied." });
      }

      return res.json({ user: sanitizeMongoDocument(user) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/auth/rover", async (req, res, next) => {
    try {
      const login = String(req.body?.login ?? "").trim().toLowerCase();
      const accessCode = String(req.body?.accessCode ?? "");
      const user = sanitizeWithPassword(await getCollections().users.findOne({
        role: "rover",
        $or: [{ username: login }, { fullNameKey: login }, { nicknameKey: login }]
      }));

      if (!user || user.password !== accessCode) {
        return res.status(401).json({ message: "Rover access denied." });
      }

      return res.json({ user: sanitizeMongoDocument(user) });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/rovers/signup", async (req, res, next) => {
    try {
      const fullName = String(req.body?.fullName ?? "").trim();
      const nickname = String(req.body?.nickname ?? "").trim();
      const phone = String(req.body?.phone ?? "").trim();
      const emergencyNote = String(req.body?.emergencyNote ?? "").trim();
      const password = String(req.body?.password ?? "");
      const confirmPassword = String(req.body?.confirmPassword ?? "");

      if (!fullName || !password) {
        return res.status(400).json({ message: "Full name and access code are required." });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Access codes do not match." });
      }

      const fullNameKey = fullName.toLowerCase();
      const existing = await getCollections().users.findOne({ role: "rover", fullNameKey });
      if (existing) {
        return res.status(409).json({ message: "A Rover with this name already exists." });
      }

      const user = {
        id: makeId("rover", fullName),
        fullName,
        fullNameKey,
        nickname,
        nicknameKey: nickname ? nickname.toLowerCase() : "",
        phone,
        emergencyNote,
        username: makeId("", fullName).replace(/^-/, ""),
        password,
        displayName: nickname || fullName,
        role: "rover",
        factionId: null,
        assignedRole: null,
        status: "unassigned",
        createdAt: new Date().toISOString()
      };

      await getCollections().users.insertOne(user);
      return res.status(201).json({ user: sanitizeMongoDocument(user) });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/rovers", async (_req, res, next) => {
    try {
      const rovers = await getCollections().users.find({ role: "rover" }).sort({ fullName: 1 }).toArray();
      res.json(rovers.map(sanitizeMongoDocument));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/rovers/:id", async (req, res, next) => {
    try {
      const collections = getCollections();
      const [rover, factions, roles] = await Promise.all([
        collections.users.findOne({ id: req.params.id, role: "rover" }),
        collections.factions.find({}).toArray(),
        collections.roles.find({}).toArray()
      ]);

      if (!rover) {
        return res.status(404).json({ message: "Rover not found." });
      }

      const safeRover = sanitizeMongoDocument(rover);
      return res.json({
        ...safeRover,
        faction: factions.map(sanitizeMongoDocument).find((faction) => faction.id === safeRover.factionId) ?? null,
        roleInfo: roles.map(sanitizeMongoDocument).find((role) => role.id === safeRover.assignedRole) ?? null
      });
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/rovers/:id/assignment", async (req, res, next) => {
    try {
      const factionId = req.body?.factionId ? String(req.body.factionId) : null;
      const assignedRole = req.body?.assignedRole ? String(req.body.assignedRole) : null;
      const collections = getCollections();
      const rover = await collections.users.findOne({ id: req.params.id, role: "rover" });

      if (!rover) {
        return res.status(404).json({ message: "Rover not found." });
      }

      if (factionId && !await collections.factions.findOne({ id: factionId })) {
        return res.status(400).json({ message: "Invalid faction." });
      }

      if (assignedRole && !await collections.roles.findOne({ id: assignedRole })) {
        return res.status(400).json({ message: "Invalid role." });
      }

      if (factionId && assignedRole) {
        const existingRoleHolder = await collections.users.findOne({
          id: { $ne: req.params.id },
          role: "rover",
          factionId,
          assignedRole
        });

        if (existingRoleHolder) {
          return res.status(409).json({
            message: `${existingRoleHolder.displayName} already holds this role in that faction.`
          });
        }
      }

      await collections.users.updateOne(
        { id: req.params.id },
        {
          $set: {
            factionId,
            assignedRole: factionId ? assignedRole : null,
            status: factionId ? "assigned" : "unassigned"
          }
        }
      );

      const updated = await collections.users.findOne({ id: req.params.id });
      const factionMemberCount = factionId
        ? await collections.users.countDocuments({ role: "rover", factionId })
        : 0;
      const warning = factionMemberCount > 5
        ? "This faction now has more than 5 Rovers."
        : "";

      return res.json({ user: sanitizeMongoDocument(updated), warning });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/factions", async (_req, res, next) => {
    try {
      res.json(await getFactionsWithMembers());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/roles", async (_req, res, next) => {
    try {
      const roles = await getCollections().roles.find({}).toArray();
      res.json(roles.map(sanitizeMongoDocument));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/evaluations", async (_req, res, next) => {
    try {
      res.json(await getEvaluationSummary());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/evaluations", async (req, res, next) => {
    try {
      const day = String(req.body?.day ?? "");
      const factionId = String(req.body?.factionId ?? "");
      const breachAlerts = Array.isArray(req.body?.breachAlerts) ? req.body.breachAlerts : [];
      const repairMissions = Array.isArray(req.body?.repairMissions) ? req.body.repairMissions : [];
      const scores = Object.fromEntries(EVALUATION_FIELDS.map((field) => [field, Number(req.body?.[field])]));

      if (!DAYS.includes(day)) {
        return res.status(400).json({ message: "Invalid day." });
      }

      if (!await getCollections().factions.findOne({ id: factionId })) {
        return res.status(400).json({ message: "Invalid faction." });
      }

      if (!Object.values(scores).every(validateScore)) {
        return res.status(400).json({ message: "Scores must be between 0 and 20." });
      }

      const evaluation = {
        id: `${day.toLowerCase().replace(/\s+/g, "-")}-${factionId}`,
        day,
        factionId,
        ...scores,
        notes: String(req.body?.notes ?? "").trim(),
        breachAlerts: breachAlerts.filter((reason) => BREACH_REASONS.includes(reason)),
        repairMissions: repairMissions.map((mission) => String(mission).trim()).filter(Boolean),
        updatedAt: new Date().toISOString()
      };

      evaluation.total = getEvaluationTotal(evaluation);

      await getCollections().evaluations.updateOne(
        { day, factionId },
        { $set: evaluation },
        { upsert: true }
      );

      res.json({ evaluation });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/individual-evaluations", async (_req, res, next) => {
    try {
      res.json(await getIndividualEvaluationSummary());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/individual-evaluations", async (req, res, next) => {
    try {
      const day = String(req.body?.day ?? "");
      const roverId = String(req.body?.roverId ?? "");
      const scores = Object.fromEntries(INDIVIDUAL_FIELDS.map((field) => [field, Number(req.body?.[field])]));

      if (!DAYS.includes(day)) {
        return res.status(400).json({ message: "Invalid day." });
      }

      const rover = await getCollections().users.findOne({ id: roverId, role: "rover" });
      if (!rover) {
        return res.status(400).json({ message: "Invalid Rover." });
      }

      if (!Object.values(scores).every(validateScore)) {
        return res.status(400).json({ message: "Individual scores must be between 0 and 20." });
      }

      const evaluation = {
        id: `${day.toLowerCase().replace(/\s+/g, "-")}-${roverId}`,
        day,
        roverId,
        ...scores,
        notes: String(req.body?.notes ?? "").trim(),
        growthMission: String(req.body?.growthMission ?? "").trim(),
        updatedAt: new Date().toISOString()
      };

      evaluation.total = getIndividualTotal(evaluation);

      await getCollections().individualEvaluations.updateOne(
        { day, roverId },
        { $set: evaluation },
        { upsert: true }
      );

      res.json({ evaluation });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/missions", async (_req, res, next) => {
    try {
      const missions = await getCollections().missions.find({}).sort({ sequence: 1 }).toArray();
      res.json(missions.map(sanitizeMongoDocument).map((mission) => ({ ...mission, answer: undefined })));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/missions/:id", async (req, res, next) => {
    try {
      const mission = sanitizeMongoDocument(await getCollections().missions.findOne({ id: req.params.id }));
      if (!mission) {
        return res.status(404).json({ message: "Mission not found." });
      }

      return res.json({ ...mission, answer: undefined });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/camp-map", async (req, res, next) => {
    try {
      const leaderMode = req.query.mode === "leader";
      res.json(await getCampMapPayload({
        includeHidden: leaderMode,
        includeLeaderOnly: leaderMode
      }));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/camp-map", async (req, res, next) => {
    try {
      const imageUrl = String(req.body?.imageUrl ?? "").trim();
      const updatedBy = String(req.body?.updatedBy ?? "Outpost Command").trim();

      await getCollections().campMaps.updateOne(
        { id: "last-outpost-blueprint" },
        {
          $set: {
            imageUrl,
            updatedAt: new Date().toISOString(),
            updatedBy
          }
        },
        { upsert: true }
      );

      res.json(await getCampMapPayload({ includeHidden: true, includeLeaderOnly: true }));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/camp-map/locations", async (req, res, next) => {
    try {
      const location = normalizeMapLocation(req.body);
      if (!location.name) {
        return res.status(400).json({ message: "Marker name is required." });
      }

      await getCollections().mapLocations.insertOne(location);
      return res.status(201).json({ location });
    } catch (error) {
      return next(error);
    }
  });

  app.put("/api/camp-map/locations/:id", async (req, res, next) => {
    try {
      const collections = getCollections();
      const existing = sanitizeMongoDocument(await collections.mapLocations.findOne({ id: req.params.id }));
      if (!existing) {
        return res.status(404).json({ message: "Map marker not found." });
      }

      const location = normalizeMapLocation(req.body, existing);
      if (!location.name) {
        return res.status(400).json({ message: "Marker name is required." });
      }

      await collections.mapLocations.updateOne({ id: req.params.id }, { $set: location });
      return res.json({ location });
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/api/camp-map/locations/:id", async (req, res, next) => {
    try {
      await getCollections().mapLocations.deleteOne({ id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/camp-map/reset", async (_req, res, next) => {
    try {
      const collections = getCollections();
      const { mapLocations } = await import("./lib/file-seed.js").then((module) => module.loadSeedDataFromFiles());
      await collections.mapLocations.deleteMany({});
      await collections.mapLocations.insertMany(mapLocations);
      res.json(await getCampMapPayload({ includeHidden: true, includeLeaderOnly: true }));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports", async (_req, res, next) => {
    try {
      const [factions, rovers, evaluations] = await Promise.all([
        getFactionsWithMembers(),
        getCollections().users.find({ role: "rover" }).toArray(),
        getEvaluationSummary()
      ]);

      const standings = evaluations.cumulative
        .map((entry) => ({ ...entry.faction, cumulativeTotal: entry.total }))
        .sort((left, right) => right.cumulativeTotal - left.cumulativeTotal);

      res.json({
        totalRovers: rovers.length,
        unassignedRovers: rovers.filter((rover) => !rover.factionId).length,
        factions,
        standings,
        bestFaction: standings[0] ?? null
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  });

  return app;
}
