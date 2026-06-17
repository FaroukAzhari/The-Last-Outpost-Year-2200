import { getCollections } from "./db.js";
import { loadSeedDataFromFiles } from "./file-seed.js";

export async function seedDatabaseIfEmpty() {
  const collections = getCollections();
  const seed = await loadSeedDataFromFiles();
  const existingUserCount = await collections.users.countDocuments();

  await Promise.all([
    collections.settings.deleteMany({ id: "app-settings" }),
    collections.factions.deleteMany({}),
    collections.roles.deleteMany({}),
    collections.missions.deleteMany({})
  ]);

  await collections.settings.insertOne({
    id: "app-settings",
    ...seed.settings
  });
  await collections.factions.insertMany(seed.factions);
  await collections.roles.insertMany(seed.roles);
  await collections.missions.insertMany(seed.missions);

  await collections.campMaps.updateOne(
    { id: seed.campMap.id },
    { $setOnInsert: seed.campMap },
    { upsert: true }
  );

  await collections.campMaps.updateOne(
    {
      id: seed.campMap.id,
      $or: [{ imageUrl: "" }, { imageUrl: { $exists: false } }]
    },
    {
      $set: {
        imageUrl: seed.campMap.imageUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: "seed"
      }
    }
  );

  if (await collections.mapLocations.countDocuments() === 0) {
    await collections.mapLocations.insertMany(seed.mapLocations);
  }

  for (const user of seed.users) {
    await collections.users.updateOne(
      { id: user.id },
      { $set: user },
      { upsert: true }
    );
  }

  if (existingUserCount === 0 && seed.evaluations.length) {
    await collections.evaluations.insertMany(seed.evaluations);
  }

  return existingUserCount === 0;
}
