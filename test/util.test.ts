/**
 * Tests shared utility helpers for permissions, mentionable detection,
 * username formatting, and embed construction.
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
