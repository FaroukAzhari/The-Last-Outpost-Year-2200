import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");

async function readJson(fileName) {
  const content = await fs.readFile(path.join(dataDir, fileName), "utf-8");
  return JSON.parse(content);
}

export async function loadSeedDataFromFiles() {
  const [users, factions, roles, missions, evaluations, settings, campMap, mapLocations] = await Promise.all([
    readJson("users.json"),
    readJson("factions.json"),
    readJson("roles.json"),
    readJson("missions.json"),
    readJson("evaluations.json"),
    readJson("settings.json"),
    readJson("campMap.json"),
    readJson("mapLocations.json")
  ]);

  return { users, factions, roles, missions, evaluations, settings, campMap, mapLocations };
}
