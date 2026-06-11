/**
 * Integration tests for the Sequelize-backed Database class.
 *
 * These tests are ignored unless TEST_DATABASE_URL is set. 
 * Todo: Create a disposable Postgres database for tests.
 */
import { assertEquals, assertRejects, assertStrictEquals } from "@std/assert";
import Database from "../src/data/postgres.ts";

const TEST_DATABASE_URL = Deno.env.get("TEST_DATABASE_URL");

async function assertRejectsWithText(
  fn: () => Promise<unknown>,
  expectedText: string,
) {
  try {
    await fn();
  } catch (err) {
    assertEquals(String(err).includes(expectedText), true);
    return;
  }
  throw new Error("Expected promise to reject");
}

async function withDatabase(
  fn: (
    db: Database,
    ids: { guildId: string; channelId: string },
  ) => Promise<void>,
) {
  const oldDatabaseUrl = Deno.env.get("DATABASE_URL");
  if (!TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must be set for database tests");
  }

  // Database reads DATABASE_URL in its constructor, so tests temporarily swap in
  // the disposable URL and restore the previous environment afterward.
  Deno.env.set("DATABASE_URL", TEST_DATABASE_URL);
  const db = new Database();
  await db.connect();
  await db.prepareDb();

  try {
    await fn(db, {
      guildId: `guild-${crypto.randomUUID()}`,
      channelId: `channel-${crypto.randomUUID()}`,
    });
  } finally {
    await db.disconnect();
    if (oldDatabaseUrl === undefined) Deno.env.delete("DATABASE_URL");
    else Deno.env.set("DATABASE_URL", oldDatabaseUrl);
  }
}

Deno.test({
  name: "Database persists scores and computes rankings",
  ignore: !TEST_DATABASE_URL,
  async fn() {
    await withDatabase(async (db, { guildId }) => {
      // Use a unique guild per test run so rows do not collide with other
      // database tests sharing the same disposable database.
      await db.setScore(guildId, "user-1", 5);
      await db.setScore(guildId, "user-2", 10);
      await db.addScore(guildId, "user-1", 2);

      assertEquals(await db.getScore(guildId, "user-2"), {
        position: 1,
        serverId: guildId,
        userId: "user-2",
        score: 10,
      });
      assertEquals(await db.getScore(guildId, "user-1"), {
        position: 2,
        serverId: guildId,
        userId: "user-1",
        score: 7,
      });

      await db.removeScore(guildId, "user-1", 3);
      assertEquals((await db.getScore(guildId, "user-1"))?.score, 4);

      await db.removeScore(guildId, "user-1", 99);
      assertStrictEquals(await db.getScore(guildId, "user-1"), null);

      await assertRejectsWithText(
        () => db.addScore(guildId, "user-3", 0),
        "must be higher",
      );
    });
  },
});

Deno.test({
  name: "Database persists encounters with guild and channel isolation",
  ignore: !TEST_DATABASE_URL,
  async fn() {
    await withDatabase(async (db, { guildId, channelId }) => {
      const otherChannel = `${channelId}-other`;

      // Encounters store multiple accepted answers for one active Pokemon while
      // remaining isolated by channel.
      await db.addEncounter(guildId, channelId, "pikachu", "en");
      await db.addEncounter(guildId, channelId, "25", "id");
      await db.addEncounter(guildId, otherChannel, "eevee", "en");

      const activeEncounter = await db.getEncounter(guildId, channelId);
      assertEquals(
        activeEncounter.map((row) => row.getDataValue("name")).sort(),
        ["25", "pikachu"],
      );

      await db.clearEncounters(guildId, channelId);
      assertEquals(await db.getEncounter(guildId, channelId), []);
      assertEquals((await db.getEncounter(guildId, otherChannel)).length, 1);
    });
  },
});

Deno.test({
  name: "Database upserts artwork, last explore, and lightning state",
  ignore: !TEST_DATABASE_URL,
  async fn() {
    await withDatabase(async (db, { guildId, channelId }) => {
      await db.setArtwork(guildId, channelId, "art-1");
      await db.setArtwork(guildId, channelId, "art-2");
      assertEquals(await db.getArtwork(guildId, channelId), "art-2");
      assertEquals(await db.unsetArtwork(guildId, channelId), 1);
      assertStrictEquals(await db.unsetArtwork(guildId, channelId), null);

      await db.setLastExplore(guildId, channelId, 100);
      await db.setLastExplore(guildId, channelId, 200);
      assertEquals(await db.getLastExplore(guildId, channelId), 200);
      assertEquals(await db.unsetLastExplore(guildId, channelId), 1);
      assertStrictEquals(await db.unsetLastExplore(guildId, channelId), null);

      await db.setLightningLoops(guildId, channelId, 3);
      await db.setLightningLoops(guildId, channelId, 2);
      assertEquals(await db.getLightningLoops(guildId, channelId), 2);
      assertEquals(await db.unsetLightningLoops(guildId, channelId), 1);
      assertStrictEquals(
        await db.unsetLightningLoops(guildId, channelId),
        null,
      );
    });
  },
});

Deno.test({
  name: "Database persists language and username settings",
  ignore: !TEST_DATABASE_URL,
  async fn() {
    await withDatabase(async (db, { guildId }) => {
      assertEquals(await db.getLanguageCode(guildId), "en_US");

      await db.setLanguage(guildId, "de_DE");
      assertEquals(await db.getLanguageCode(guildId), "de_DE");
      await assertRejectsWithText(
        () => db.setLanguage(guildId, "de_DE"),
        "already set",
      );

      await db.setLanguage(guildId, "en_US");
      assertEquals(await db.getLanguageCode(guildId), "en_US");
      await db.unsetLanguage(guildId);
      assertEquals(await db.getLanguageCode(guildId), "en_US");

      await db.setUsernameMode(guildId, 0);
      assertEquals(
        (await db.getUsernameMode(guildId))?.getDataValue("mode"),
        0,
      );
      await db.setUsernameMode(guildId, 4);
      assertEquals(
        (await db.getUsernameMode(guildId))?.getDataValue("mode"),
        4,
      );
      await assertRejects(
        () => db.setUsernameMode(guildId, 5),
        Error,
        "between 0 and 4",
      );
    });
  },
});

Deno.test({
  name: "Database resets guild-scoped settings without touching other guilds",
  ignore: !TEST_DATABASE_URL,
  async fn() {
    await withDatabase(async (db, { guildId }) => {
      const otherGuild = `${guildId}-other`;
      const channel = { id: "channel-1", guildId };
      const otherChannel = { id: "channel-2", guildId: otherGuild };

      await db.addChannel(channel as never);
      await db.addChannel(otherChannel as never);

      assertEquals(await db.isAnyAllowedChannel(guildId), true);
      assertEquals(await db.isAnyAllowedChannel(otherGuild), true);

      await db.resetChannels(guildId);
      assertEquals(await db.isAnyAllowedChannel(guildId), false);
      assertEquals(await db.isAnyAllowedChannel(otherGuild), true);
    });
  },
});
