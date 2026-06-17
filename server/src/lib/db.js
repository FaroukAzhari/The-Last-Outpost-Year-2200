import { MongoClient, ServerApiVersion } from "mongodb";

let client;
let db;

function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "havenwoodMissionControl";

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return { uri, dbName };
}

export async function connectToDatabase() {
  if (db) {
    return db;
  }

  const { uri, dbName } = getMongoConfig();
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });

  await client.connect();
  db = client.db(dbName);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database has not been connected yet.");
  }

  return db;
}

export function getCollections() {
  const database = getDb();

  return {
    users: database.collection("users"),
    factions: database.collection("factions"),
    roles: database.collection("roles"),
    missions: database.collection("missions"),
    evaluations: database.collection("evaluations"),
    individualEvaluations: database.collection("individualEvaluations"),
    campMaps: database.collection("campMaps"),
    mapLocations: database.collection("mapLocations"),
    settings: database.collection("settings")
  };
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
  }

  client = undefined;
  db = undefined;
}
