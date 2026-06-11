/**
 * Tests shared utility helpers for permissions, mentionable detection,
 * username formatting, PokeAPI payload mapping, and embed construction.
 */
import { assertEquals, assertStrictEquals } from "@std/assert";
import {
  APIGuildMember,
  GuildMember,
  PermissionsBitField,
  Role,
  User,
} from "discord.js";
import Util from "../src/util.ts";
import { enLanguage, usernameModeLabels } from "./fixtures/language.ts";
import {
  createGuildMember as createFakeGuildMember,
  createInteraction,
  embedJsonFromPayload,
  getLastCall,
} from "./helpers.ts";

function createGuildMember(
  options: {
    id?: string;
    ownerId?: string;
    nickname?: string | null;
    username?: string;
    globalName?: string | null;
    administrator?: boolean;
  } = {},
): GuildMember {
  return {
    id: options.id ?? "111111111111111111",
    nickname: options.nickname ?? null,
    guild: { ownerId: options.ownerId ?? "999999999999999999" },
    permissions: new PermissionsBitField(
      options.administrator ? PermissionsBitField.Flags.Administrator : 0n,
    ),
    user: {
      username: options.username ?? "testuser",
      globalName: options.globalName ?? null,
    },
  } as GuildMember;
}

function createUser(): User {
  return Object.create(User.prototype) as User;
}

function createRole(): Role {
  return Object.create(Role.prototype) as Role;
}

Deno.test("Util.capitalize capitalizes pokemon names", () => {
  assertEquals(Util.capitalize("pikachu"), "Pikachu");
  assertEquals(Util.capitalize("PIKACHU"), "Pikachu");
  assertEquals(Util.capitalize("bUlBaSaUr"), "Bulbasaur");
});

Deno.test("Util.translateUsernameModeId maps mode ids to language strings", () => {
  assertEquals(
    Util.translateUsernameModeId(0, usernameModeLabels),
    usernameModeLabels.username_mode_0,
  );
  assertEquals(
    Util.translateUsernameModeId(1, usernameModeLabels),
    usernameModeLabels.username_mode_1,
  );
  assertEquals(
    Util.translateUsernameModeId(2, usernameModeLabels),
    usernameModeLabels.username_mode_2,
  );
  assertEquals(
    Util.translateUsernameModeId(3, usernameModeLabels),
    usernameModeLabels.username_mode_3,
  );
  assertEquals(
    Util.translateUsernameModeId(4, usernameModeLabels),
    usernameModeLabels.username_mode_4,
  );
  assertEquals(
    Util.translateUsernameModeId(99, usernameModeLabels),
    usernameModeLabels.username_mode_4,
  );
});

Deno.test("Util.getCorrectUsernameFormat respects username display modes", () => {
  const fullMember = createGuildMember({
    nickname: "Server Nick",
    username: "plainuser",
    globalName: "Display Name",
  });

  assertEquals(Util.getCorrectUsernameFormat(0, fullMember), "Server Nick");
  assertEquals(Util.getCorrectUsernameFormat(1, fullMember), "Server Nick");
  assertEquals(Util.getCorrectUsernameFormat(2, fullMember), "Display Name");
  assertEquals(Util.getCorrectUsernameFormat(3, fullMember), "Display Name");
  assertEquals(Util.getCorrectUsernameFormat(4, fullMember), "plainuser");

  const noNickname = createGuildMember({
    nickname: null,
    username: "plainuser",
    globalName: "Display Name",
  });
  assertEquals(Util.getCorrectUsernameFormat(0, noNickname), "Display Name");
  assertEquals(Util.getCorrectUsernameFormat(1, noNickname), "plainuser");

  const usernameOnly = createGuildMember({
    nickname: null,
    username: "plainuser",
    globalName: null,
  });
  assertEquals(Util.getCorrectUsernameFormat(0, usernameOnly), "plainuser");
  assertEquals(Util.getCorrectUsernameFormat(2, usernameOnly), "plainuser");
});

Deno.test("Util.isAdmin detects owners and administrators", () => {
  const owner = createGuildMember({ id: "123", ownerId: "123" });
  const admin = createGuildMember({ administrator: true });
  const player = createGuildMember({ administrator: false });

  assertEquals(Util.isAdmin(owner), true);
  assertEquals(Util.isAdmin(admin), true);
  assertEquals(Util.isAdmin(player), false);
});

Deno.test("Util.isUser and Util.isRole classify mentionables", () => {
  const user = createUser();
  const member = Object.create(GuildMember.prototype) as GuildMember;
  const role = createRole();
  const apiMember = { user: { id: "1" } } as APIGuildMember;

  assertEquals(Util.isUser(user), true);
  assertEquals(Util.isUser(member), true);
  assertEquals(Util.isUser(role), false);
  assertEquals(Util.isUser(apiMember), false);

  assertEquals(Util.isRole(role), true);
  assertEquals(Util.isRole(user), false);
  assertEquals(Util.isRole(member), false);
});

Deno.test("Util.returnEmbed builds themed embeds", () => {
  const withoutImage = Util.returnEmbed("Title", "Description", enLanguage);
  const embedData = withoutImage.embed.toJSON();

  assertEquals(embedData.title, "Title");
  assertEquals(embedData.description, "Description");
  assertEquals(embedData.color, 0x00ae86);
  assertEquals(embedData.author?.name, enLanguage.obj.embed_author_name);
  assertEquals(embedData.footer?.text, enLanguage.obj.credits_text);
  assertStrictEquals(withoutImage.attachment, null);

  const withImage = Util.returnEmbed(
    "Caught",
    "Nice catch",
    enLanguage,
    0xff0000,
    "https://example.com/sprite.png",
  );
  const imageEmbed = withImage.embed.toJSON();

  assertEquals(imageEmbed.color, 0xff0000);
  assertEquals(imageEmbed.image?.url, "attachment://pokemon.png");
  assertEquals(withImage.attachment?.name, "pokemon.png");
});

Deno.test("Util.fileExists reports file presence", async () => {
  const dir = await Deno.makeTempDir();
  const existing = `${dir}/exists.txt`;
  await Deno.writeTextFile(existing, "ok");

  assertEquals(await Util.fileExists(existing), true);
  assertEquals(await Util.fileExists(`${dir}/missing.txt`), false);

  await Deno.remove(dir, { recursive: true });
});

Deno.test("Util.generatePokemon selects a random PokeAPI result", async () => {
  const originalFetch = globalThis.fetch;
  const originalRandom = Math.random;
  // Replace both fetch and Math.random so the random selection is deterministic
  // and does not make a live PokeAPI request.
  globalThis.fetch = (() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          results: [
            { name: "bulbasaur", url: "1" },
            { name: "ivysaur", url: "2" },
            { name: "venusaur", url: "3" },
            { name: "charmander", url: "4" },
          ],
        }),
    } as Response)) as typeof fetch;
  Math.random = () => 0.75;

  try {
    assertEquals(await Util.generatePokemon(), {
      name: "charmander",
      url: "4",
    });
  } finally {
    globalThis.fetch = originalFetch;
    Math.random = originalRandom;
  }
});

Deno.test("Util.fetchSprite maps PokeAPI sprite payloads", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          sprites: {
            back_default: "back",
            back_female: "back-female",
            back_shiny: "back-shiny",
            back_shiny_female: "back-shiny-female",
            front_default: "front",
            front_female: "front-female",
            front_shiny: "front-shiny",
            front_shiny_female: "front-shiny-female",
            other: {
              dream_world: {
                front_default: "dream",
                front_female: "dream-female",
              },
              home: {
                front_default: "home",
                front_female: "home-female",
                front_shiny: "home-shiny",
                front_shiny_female: "home-shiny-female",
              },
              "official-artwork": {
                front_default: "official",
              },
            },
          },
        }),
    } as Response)) as typeof fetch;

  try {
    const sprites = await Util.fetchSprite("https://example.com/pokemon/25");

    assertEquals(sprites.front_default, "front");
    assertEquals(sprites.back_shiny, "back-shiny");
    assertEquals(sprites.other.dream_world.front_default, "dream");
    assertEquals(sprites.other.home.front_shiny_female, "home-shiny-female");
    assertEquals(sprites.other.official_artwork.front_default, "official");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Util.fetchNames maps species names and returns null on failure", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          names: [
            {
              language: { name: "en", url: "language/en" },
              name: "Pikachu",
            },
            {
              language: { name: "de", url: "language/de" },
              name: "Pikachu",
            },
          ],
        }),
    } as Response)) as typeof fetch;

  try {
    assertEquals(await Util.fetchNames("25"), [
      { languageName: "en", languageUrl: "language/en", name: "Pikachu" },
      { languageName: "de", languageUrl: "language/de", name: "Pikachu" },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // Some Pokemon form ids fail at the species endpoint; callers expect null
  // rather than a thrown error so they can retry encounter generation.
  globalThis.fetch =
    (() => Promise.reject(new Error("network"))) as typeof fetch;
  try {
    assertStrictEquals(await Util.fetchNames("missing"), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Util.findMember returns cached members and hides missing members", async () => {
  const member = createFakeGuildMember({ id: "member-1" });
  const interaction = createInteraction({
    members: { "member-1": member },
  });

  assertStrictEquals(
    await Util.findMember(interaction as never, "member-1"),
    member,
  );
  assertStrictEquals(
    await Util.findMember(interaction as never, "missing-member"),
    undefined,
  );
});

Deno.test("Util.findUser fetches Discord users", async () => {
  const user = { id: "user-1", tag: "user#0001" };
  const interaction = {
    client: {
      users: {
        fetch: (id: string, options: { force: boolean }) => {
          assertEquals(id, "user-1");
          assertEquals(options, { force: false });
          return Promise.resolve(user);
        },
      },
    },
  };

  assertStrictEquals(await Util.findUser(interaction as never, "user-1"), user);
});

Deno.test("Util.editReply sends themed embeds", async () => {
  const interaction = createInteraction();

  await Util.editReply(
    interaction as never,
    "Utility Title",
    "Utility body",
    enLanguage,
  );

  const payload = getLastCall(interaction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertEquals(embed.title, "Utility Title");
  assertEquals(embed.description, "Utility body");
});
