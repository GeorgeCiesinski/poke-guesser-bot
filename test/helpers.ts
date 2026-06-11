/**
 * Shared test doubles for Discord interactions, Sequelize-style rows, and
 * localized embed assertions used by command-handler tests.
 */
import { PermissionsBitField } from "discord.js";
import enUS from "../src/languages/en_US.json" with { type: "json" };

// Records a fake Discord interaction method call. `T` is the argument type for
// the captured call; by default tests store arguments as `unknown[]`.
export type Call<T = unknown> = {
  name: string;
  args: T[];
};

export type FakeOptionsConfig = {
  subcommand?: string;
  subcommandGroup?: string | null;
  strings?: Record<string, string | null>;
  integers?: Record<string, number | null>;
  users?: Record<string, unknown | null>;
  mentionables?: Record<string, unknown | null>;
  channels?: Record<string, unknown | null>;
};

export function modelRow<T extends Record<string, unknown>>(values: T): T & {
  getDataValue(key: keyof T & string): T[keyof T];
  get(key: keyof T & string): T[keyof T];
} {
  // Command handlers read Sequelize rows through `getDataValue()`/`get()`, so
  // these fakes keep tests focused without constructing real models.
  return {
    ...values,
    getDataValue(key: keyof T & string) {
      return values[key];
    },
    get(key: keyof T & string) {
      return values[key];
    },
  };
}

export function createOptions(config: FakeOptionsConfig = {}) {
  return {
    getSubcommandGroup(_required = true) {
      return config.subcommandGroup ?? null;
    },
    getSubcommand() {
      return config.subcommand ?? "";
    },
    getString(name: string) {
      return config.strings?.[name] ?? null;
    },
    getInteger(name: string) {
      return config.integers?.[name] ?? null;
    },
    getUser(name: string) {
      return config.users?.[name] ?? null;
    },
    getMentionable(name: string) {
      return config.mentionables?.[name] ?? null;
    },
    getChannel(name: string) {
      return config.channels?.[name] ?? null;
    },
  };
}

export function createInteraction(
  config: FakeOptionsConfig & {
    commandName?: string;
    guildId?: string;
    channelId?: string;
    user?: { id: string; tag?: string };
    ownerId?: string;
    admin?: boolean;
    member?: unknown;
    members?: Record<string, unknown>;
  } = {},
) {
  const calls: Call[] = [];
  const guildId = config.guildId ?? "guild-1";
  const channelId = config.channelId ?? "channel-1";
  const user = config.user ?? { id: "user-1", tag: "user#0001" };
  const members = config.members ?? {};

  // Record outbound Discord calls so tests can inspect replies without needing
  // Discord.js clients, channels, or network access.
  const interaction = {
    calls,
    commandName: config.commandName ?? "command",
    guildId,
    channelId,
    user,
    member: config.member ?? null,
    guild: {
      id: guildId,
      ownerId: config.ownerId ?? "owner-1",
      available: true,
      members: {
        fetch: ({ user: id }: { user: string }) =>
          members[id]
            ? Promise.resolve(members[id])
            : Promise.reject(new Error("member not found")),
      },
    },
    channel: { id: channelId, guildId },
    memberPermissions: new PermissionsBitField(
      config.admin ? PermissionsBitField.Flags.Administrator : 0n,
    ),
    options: createOptions(config),
    deferReply: (...args: unknown[]) => {
      calls.push({ name: "deferReply", args });
      return Promise.resolve();
    },
    deferUpdate: (...args: unknown[]) => {
      calls.push({ name: "deferUpdate", args });
      return Promise.resolve();
    },
    editReply: (...args: unknown[]) => {
      calls.push({ name: "editReply", args });
      return Promise.resolve(args[0]);
    },
    followUp: (...args: unknown[]) => {
      calls.push({ name: "followUp", args });
      return Promise.resolve(args[0]);
    },
  };

  return interaction;
}

export function createDb(overrides: Record<string, unknown> = {}) {
  return {
    getLanguageCode: () => Promise.resolve("en_US"),
    ...overrides,
  };
}

export function createGuildMember(
  config: {
    id?: string;
    guildId?: string;
    ownerId?: string;
    nickname?: string | null;
    username?: string;
    globalName?: string | null;
    roles?: unknown[];
  } = {},
) {
  const guildId = config.guildId ?? "guild-1";
  const id = config.id ?? "member-1";
  return {
    id,
    nickname: config.nickname ?? null,
    guild: { id: guildId, ownerId: config.ownerId ?? "owner-1" },
    user: {
      id,
      username: config.username ?? id,
      globalName: config.globalName ?? null,
    },
    roles: {
      cache: new Map((config.roles ?? []).map((role, index) => [
        `role-${index}`,
        role,
      ])),
    },
  };
}

export function createRole(id = "role-1", guildId = "guild-1") {
  return { id, guild: { id: guildId } };
}

export function getLastCall(interaction: { calls: Call[] }, name: string) {
  return interaction.calls.filter((call) => call.name === name).at(-1);
}

export function embedJsonFromPayload(payload: unknown) {
  const embed = (payload as { embeds: { toJSON(): unknown }[] }).embeds[0];
  return embed.toJSON() as Record<string, unknown>;
}

export const enLanguage = {
  code: "en_US",
  obj: enUS as { [key: string]: string },
};
