import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");

function getFilePath(fileName) {
  return path.join(dataDir, fileName);
}

export async function readJson(fileName) {
  const content = await fs.readFile(getFilePath(fileName), "utf-8");
  return JSON.parse(content);
}

export async function writeJson(fileName, data) {
  const filePath = getFilePath(fileName);
  const tempPath = `${filePath}.tmp`;
  const serialized = JSON.stringify(data, null, 2);

  await fs.writeFile(tempPath, `${serialized}\n`, "utf-8");
  await fs.rename(tempPath, filePath);
}

export async function readState() {
  const [crews, members, missions, evaluations, settings] = await Promise.all([
    readJson("crews.json"),
    readJson("members.json"),
    readJson("missions.json"),
    readJson("evaluations.json"),
    readJson("settings.json")
  ]);

  return { crews, members, missions, evaluations, settings };
}
