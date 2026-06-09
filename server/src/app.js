import express from "express";
import cors from "cors";
import { readState, writeJson, readJson } from "./lib/store.js";
import { averageTraits, calculateFinalScore, getGateStabilityLevel } from "./lib/scoring.js";

const FINAL_TITLES = [
  "The Spark",
  "The Compass",
  "The Shield",
  "The Signal",
  "The Mind",
  "The Anchor",
  "The Flame",
  "The Breaker"
];

const DAY_ORDER = [
  "Day 1: The Signal Begins",
  "Day 2: Into the Other Side",
  "Day 3: The Mind Flayer Day",
  "Day 4: Close the Gate"
];

function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function getCrewMissionScore(crew, missionsById) {
  return crew.completedMissionIds.reduce((sum, missionId) => {
    const mission = missionsById.get(missionId);
    return sum + (mission?.points ?? 0);
  }, 0);
}

function enrichCrew(crew, missions) {
  const missionsById = new Map(missions.map((mission) => [mission.id, mission]));
  const missionScore = getCrewMissionScore(crew, missionsById);
  const computedCrew = {
    ...crew,
    missionScore
  };
  const totalScore = calculateFinalScore(computedCrew);

  return {
    ...computedCrew,
    totalScore,
    gateStabilityLevel: getGateStabilityLevel(totalScore),
    activeMissions: crew.activeMissionIds
      .map((missionId) => missionsById.get(missionId))
      .filter(Boolean),
    completedMissions: crew.completedMissionIds
      .map((missionId) => missionsById.get(missionId))
      .filter(Boolean)
  };
}

function getMissionStatus(mission, crew) {
  if (!crew) {
    return mission.hasAnswer ? "locked" : "active";
  }

  if (crew.completedMissionIds.includes(mission.id)) {
    return "completed";
  }

  if (crew.activeMissionIds.includes(mission.id)) {
    return "active";
  }

  return "locked";
}

function unlockNextMission(crew, missions) {
  const ordered = [...missions].sort((left, right) => left.sequence - right.sequence);
  const nextMission = ordered.find((mission) => (
    !crew.completedMissionIds.includes(mission.id) &&
    !crew.activeMissionIds.includes(mission.id)
  ));

  if (nextMission) {
    crew.activeMissionIds.push(nextMission.id);
  }
}

async function persistCrews(crews) {
  await writeJson("crews.json", crews);
}

async function persistEvaluations(evaluations) {
  await writeJson("evaluations.json", evaluations);
}

async function persistSettings(settings) {
  await writeJson("settings.json", settings);
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/settings/public", async (_req, res, next) => {
    try {
      const settings = await readJson("settings.json");
      res.json({
        campTitle: settings.campTitle,
        subtitle: settings.subtitle,
        backstory: settings.backstory,
        overallGateStatus: settings.overallGateStatus
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/crews", async (_req, res, next) => {
    try {
      const { crews, missions } = await readState();
      res.json(crews.map((crew) => enrichCrew(crew, missions)));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/crews/:id", async (req, res, next) => {
    try {
      const { crews, missions } = await readState();
      const crew = crews.find((item) => item.id === req.params.id);

      if (!crew) {
        return res.status(404).json({ message: "Crew not found." });
      }

      return res.json(enrichCrew(crew, missions));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/crews/:id/light", async (req, res, next) => {
    try {
      const delta = Number(req.body?.delta);
      if (![1, -1].includes(delta)) {
        return res.status(400).json({ message: "delta must be 1 or -1." });
      }

      const { crews, missions } = await readState();
      const crew = crews.find((item) => item.id === req.params.id);

      if (!crew) {
        return res.status(404).json({ message: "Crew not found." });
      }

      crew.lightTokens = Math.max(0, crew.lightTokens + delta);
      await persistCrews(crews);
      return res.json(enrichCrew(crew, missions));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/crews/:id/shadow", async (req, res, next) => {
    try {
      const delta = Number(req.body?.delta);
      if (![1, -1].includes(delta)) {
        return res.status(400).json({ message: "delta must be 1 or -1." });
      }

      const { crews, missions } = await readState();
      const crew = crews.find((item) => item.id === req.params.id);

      if (!crew) {
        return res.status(404).json({ message: "Crew not found." });
      }

      crew.shadowMarks = Math.max(0, crew.shadowMarks + delta);
      await persistCrews(crews);
      return res.json(enrichCrew(crew, missions));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/crews/:id/recovery", async (req, res, next) => {
    try {
      const amount = Number(req.body?.amount);
      if (Number.isNaN(amount)) {
        return res.status(400).json({ message: "amount must be a number." });
      }

      const { crews, missions } = await readState();
      const crew = crews.find((item) => item.id === req.params.id);

      if (!crew) {
        return res.status(404).json({ message: "Crew not found." });
      }

      crew.recoveryBonus += amount;
      await persistCrews(crews);
      return res.json(enrichCrew(crew, missions));
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/crews/:id/note", async (req, res, next) => {
    try {
      const note = String(req.body?.note ?? "").trim();
      const { crews, missions } = await readState();
      const crew = crews.find((item) => item.id === req.params.id);

      if (!crew) {
        return res.status(404).json({ message: "Crew not found." });
      }

      crew.leaderNote = note;
      await persistCrews(crews);
      return res.json(enrichCrew(crew, missions));
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/missions", async (req, res, next) => {
    try {
      const { missions, crews } = await readState();
      const crew = crews.find((item) => item.id === req.query.crewId);
      const payload = DAY_ORDER.map((day) => ({
        day,
        missions: missions
          .filter((mission) => mission.day === day)
          .sort((left, right) => left.sequence - right.sequence)
          .map((mission) => ({
            ...mission,
            answer: undefined,
            status: getMissionStatus(mission, crew)
          }))
      }));

      return res.json(payload);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/missions/:id", async (req, res, next) => {
    try {
      const { missions, crews } = await readState();
      const mission = missions.find((item) => item.id === req.params.id);

      if (!mission) {
        return res.status(404).json({ message: "Mission not found." });
      }

      const crew = crews.find((item) => item.id === req.query.crewId);
      return res.json({
        ...mission,
        answer: undefined,
        status: getMissionStatus(mission, crew)
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/missions/:id/submit", async (req, res, next) => {
    try {
      const crewId = String(req.body?.crewId ?? "");
      const answer = req.body?.answer;
      const { crews, missions } = await readState();
      const crew = crews.find((item) => item.id === crewId);
      const mission = missions.find((item) => item.id === req.params.id);

      if (!crew) {
        return res.status(404).json({ message: "Crew not found." });
      }

      if (!mission) {
        return res.status(404).json({ message: "Mission not found." });
      }

      if (!mission.hasAnswer) {
        return res.status(400).json({ message: "This mission requires leader verification." });
      }

      const isCorrect = normalizeAnswer(answer) === normalizeAnswer(mission.answer);

      if (!isCorrect) {
        return res.status(200).json({
          success: false,
          status: getMissionStatus(mission, crew),
          message: "STATIC DETECTED"
        });
      }

      if (!crew.completedMissionIds.includes(mission.id)) {
        crew.completedMissionIds.push(mission.id);
        crew.activeMissionIds = crew.activeMissionIds.filter((missionId) => missionId !== mission.id);
        unlockNextMission(crew, missions);
        crew.latestTransmission = `ACCESS GRANTED: ${mission.title} cleared.`;
        await persistCrews(crews);
      }

      return res.json({
        success: true,
        status: "completed",
        message: "ACCESS GRANTED",
        crew: enrichCrew(crew, missions)
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/members", async (_req, res, next) => {
    try {
      const { members, evaluations, crews } = await readState();
      const evaluationsByMemberId = new Map(evaluations.map((evaluation) => [evaluation.memberId, evaluation]));
      const crewsById = new Map(crews.map((crew) => [crew.id, crew]));
      const payload = members.map((member) => ({
        ...member,
        crewName: crewsById.get(member.crewId)?.name ?? member.crewId,
        evaluation: evaluationsByMemberId.get(member.id) ?? null
      }));

      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/members/:id/evaluate", async (req, res, next) => {
    try {
      const memberId = req.params.id;
      const { members, evaluations } = await readState();
      const member = members.find((item) => item.id === memberId);

      if (!member) {
        return res.status(404).json({ message: "Member not found." });
      }

      const evaluation = {
        memberId,
        courage: Number(req.body?.courage),
        loyalty: Number(req.body?.loyalty),
        intelligence: Number(req.body?.intelligence),
        discipline: Number(req.body?.discipline),
        spirit: Number(req.body?.spirit),
        leaderNote: String(req.body?.leaderNote ?? "").trim(),
        finalTitle: String(req.body?.finalTitle ?? "").trim()
      };

      const traitsAreValid = [
        evaluation.courage,
        evaluation.loyalty,
        evaluation.intelligence,
        evaluation.discipline,
        evaluation.spirit
      ].every((value) => Number.isFinite(value) && value >= 0 && value <= 10);

      if (!traitsAreValid) {
        return res.status(400).json({ message: "Trait scores must be between 0 and 10." });
      }

      if (!FINAL_TITLES.includes(evaluation.finalTitle)) {
        return res.status(400).json({ message: "Invalid final title." });
      }

      const existingIndex = evaluations.findIndex((item) => item.memberId === memberId);
      if (existingIndex >= 0) {
        evaluations[existingIndex] = evaluation;
      } else {
        evaluations.push(evaluation);
      }

      await persistEvaluations(evaluations);
      return res.json({
        ...member,
        evaluation,
        averageScore: averageTraits(evaluation)
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/reports", async (_req, res, next) => {
    try {
      const { crews, missions, members, evaluations, settings } = await readState();
      const enrichedCrews = crews
        .map((crew) => enrichCrew(crew, missions))
        .sort((left, right) => right.totalScore - left.totalScore);
      const evaluationsByMemberId = new Map(evaluations.map((evaluation) => [evaluation.memberId, evaluation]));

      const rankedMembers = members
        .map((member) => {
          const evaluation = evaluationsByMemberId.get(member.id);
          return {
            ...member,
            evaluation,
            averageScore: averageTraits(evaluation)
          };
        })
        .filter((member) => member.evaluation)
        .sort((left, right) => right.averageScore - left.averageScore);

      const mostImproved = settings.mostImprovedMemberId
        ? members.find((member) => member.id === settings.mostImprovedMemberId) ?? null
        : null;

      res.json({
        overallGateStatus: settings.overallGateStatus,
        standings: enrichedCrews,
        bestTeam: enrichedCrews[0] ?? null,
        bestMember: rankedMembers[0] ?? null,
        mostImproved,
        finalTitles: FINAL_TITLES
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reports/most-improved", async (req, res, next) => {
    try {
      const memberId = req.body?.memberId ? String(req.body.memberId) : null;
      const { members, settings } = await readState();

      if (memberId && !members.some((member) => member.id === memberId)) {
        return res.status(404).json({ message: "Member not found." });
      }

      settings.mostImprovedMemberId = memberId;
      await persistSettings(settings);
      res.json({ mostImprovedMemberId: memberId });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  });

  return app;
}
