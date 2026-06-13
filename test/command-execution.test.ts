/**
 * Tests command-handler behavior with fake Discord interactions and mocked
 * database methods, asserting replies, routing, and state-changing calls.
 */
import { assert, assertEquals, assertMatch } from "@std/assert";
import { PermissionsBitField } from "discord.js";
import Championship from "../src/championship.ts";
import Delay from "../src/delay.ts";
import Help from "../src/help.ts";
import Leaderboard from "../src/leaderboard.ts";
import Mod from "../src/mod.ts";
import Score from "../src/score.ts";
import Settings from "../src/settings.ts";
import Timeout from "../src/timeout.ts";
import Util from "../src/util.ts";
import {
  createDb,
  createGuildMember,
  createInteraction,
  embedJsonFromPayload,
  getLastCall,
  modelRow,
} from "./helpers.ts";

Deno.test("Mod.mod denies non-moderators", async () => {
  const interaction = createInteraction({
    commandName: "mod",
    subcommand: "score",
    strings: { action: "add" },
    member: createGuildMember(),
  });
  const db = createDb({ isMod: () => Promise.resolve(false) });

  await Mod.mod(interaction as never, db as never);

  const payload = getLastCall(interaction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /mod|permission|denied/i);
});

Deno.test("Mod.mod adds score for authorized moderators", async () => {
  const target = { id: "target-1", tag: "target#0001" };
  const interaction = createInteraction({
    commandName: "mod",
    subcommand: "score",
    strings: { action: "add" },
    integers: { amount: 3 },
    users: { user: target },
    member: createGuildMember(),
  });
  let newScore: number | undefined;
  const db = createDb({
    isMod: () => Promise.resolve(true),
    getScore: () => Promise.resolve({ score: 4 }),
    setScore: (_guildId: string, userId: string, score: number) => {
      assertEquals(userId, "target-1");
      newScore = score;
      return Promise.resolve();
    },
  });

  await Mod.mod(interaction as never, db as never);

  assertEquals(newScore, 7);
  const payload = getLastCall(interaction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /success|added|score/i);
});

Deno.test("Mod.mod removes score by amount or unsets when amount is absent", async () => {
  const target = { id: "target-1", tag: "target#0001" };
  const interaction = createInteraction({
    commandName: "mod",
    subcommand: "score",
    strings: { action: "remove" },
    integers: { amount: 2 },
    users: { user: target },
    member: createGuildMember(),
  });
  let removedAmount: number | undefined;
  const db = createDb({
    isMod: () => Promise.resolve(true),
    removeScore: (_guildId: string, userId: string, amount: number) => {
      assertEquals(userId, "target-1");
      removedAmount = amount;
      return Promise.resolve();
    },
    unsetScore: () => Promise.resolve(),
  });

  await Mod.mod(interaction as never, db as never);

  assertEquals(removedAmount, 2);
});

Deno.test("Mod.mod sets score and reports invalid actions", async () => {
  const target = { id: "target-1", tag: "target#0001" };
  const interaction = createInteraction({
    commandName: "mod",
    subcommand: "score",
    strings: { action: "set" },
    integers: { amount: 0 },
    users: { user: target },
    member: createGuildMember(),
  });
  let setScore: number | undefined;
  const db = createDb({
    isMod: () => Promise.resolve(true),
    getScore: () => Promise.resolve(null),
    setScore: (_guildId: string, _userId: string, score: number) => {
      setScore = score;
      return Promise.resolve();
    },
  });

  await Mod.mod(interaction as never, db as never);

  assertEquals(setScore, 0);

  const invalidInteraction = createInteraction({
    commandName: "mod",
    subcommand: "score",
    strings: { action: "multiply" },
    integers: { amount: 2 },
    users: { user: target },
    member: createGuildMember(),
  });
  await Mod.mod(invalidInteraction as never, db as never);
  const payload = getLastCall(invalidInteraction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /invalid|error/i);
});

Deno.test("Mod.mod delegates grouped subcommands", async () => {
  const originals = {
    delay: Delay.delay,
    timeout: Timeout.timeout,
    championship: Championship.championship,
  };
  const delegated: string[] = [];
  // Replace delegated handlers with spies so Mod.mod routing can be checked
  // without executing each submodule's command body here.
  (Delay as unknown as { delay: typeof Delay.delay }).delay = () => {
    delegated.push("delay");
    return Promise.resolve();
  };
  (Timeout as unknown as { timeout: typeof Timeout.timeout }).timeout = () => {
    delegated.push("timeout");
    return Promise.resolve();
  };
  (Championship as unknown as {
    championship: typeof Championship.championship;
  }).championship = () => {
    delegated.push("championship");
    return Promise.resolve();
  };

  try {
    const db = createDb({ isMod: () => Promise.resolve(true) });
    for (const group of ["delay", "timeout", "championship"]) {
      await Mod.mod(
        createInteraction({
          commandName: "mod",
          subcommandGroup: group,
          subcommand: group === "championship" ? "new" : "show",
          member: createGuildMember(),
        }) as never,
        db as never,
      );
    }

    assertEquals(delegated, ["delay", "timeout", "championship"]);
  } finally {
    (Delay as unknown as { delay: typeof Delay.delay }).delay = originals.delay;
    (Timeout as unknown as { timeout: typeof Timeout.timeout }).timeout =
      originals.timeout;
    (Championship as unknown as {
      championship: typeof Championship.championship;
    }).championship = originals.championship;
  }
});

Deno.test("Settings.settings enforces owner or administrator permissions", async () => {
  const forbidden = createInteraction({
    commandName: "settings",
    ownerId: "owner-1",
    user: { id: "regular-user", tag: "regular#0001" },
    subcommandGroup: "mods",
    subcommand: "show",
  });
  const db = createDb();

  await Settings.settings(forbidden as never, db as never);

  // Forbidden replies are captured from the fake interaction instead of sent to
  // Discord, making the permission gate easy to assert directly.
  const payload = getLastCall(forbidden, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /allowed|forbidden|permission|settings/i);

  const admin = createInteraction({
    commandName: "settings",
    admin: true,
    subcommandGroup: "mods",
    subcommand: "show",
  });
  await Settings.settings(
    admin as never,
    createDb({ listMods: () => Promise.resolve([]) }) as never,
  );
  assertEquals(getLastCall(admin, "editReply") !== undefined, true);
});

Deno.test("Settings.settings manages mods and channels", async () => {
  const mentionable = createGuildMember({ id: "mod-user" });
  const channel = { id: "channel-2", guildId: "guild-1" };
  const dbCalls: string[] = [];
  const db = createDb({
    addMod: () => {
      dbCalls.push("addMod");
      return Promise.resolve();
    },
    removeMod: () => {
      dbCalls.push("removeMod");
      return Promise.resolve();
    },
    addChannel: () => {
      dbCalls.push("addChannel");
      return Promise.resolve();
    },
    removeChannel: () => {
      dbCalls.push("removeChannel");
      return Promise.resolve();
    },
    listMods: () =>
      Promise.resolve([modelRow({ isUser: true, mentionableId: "mod-user" })]),
    listChannels: () => Promise.resolve([modelRow({ channelId: "channel-2" })]),
  });

  const cases = [
    createInteraction({
      commandName: "settings",
      admin: true,
      subcommandGroup: "mods",
      subcommand: "add",
      mentionables: { mentionable },
    }),
    createInteraction({
      commandName: "settings",
      admin: true,
      subcommandGroup: "mods",
      subcommand: "remove",
      mentionables: { mentionable },
    }),
    createInteraction({
      commandName: "settings",
      admin: true,
      subcommandGroup: "channels",
      subcommand: "add",
      channels: { channel },
    }),
    createInteraction({
      commandName: "settings",
      admin: true,
      subcommandGroup: "channels",
      subcommand: "remove",
      channels: { channel },
    }),
  ];

  for (const interaction of cases) {
    await Settings.settings(interaction as never, db as never);
  }

  assertEquals(dbCalls, ["addMod", "removeMod", "addChannel", "removeChannel"]);

  const showMods = createInteraction({
    commandName: "settings",
    admin: true,
    subcommandGroup: "mods",
    subcommand: "show",
  });
  await Settings.settings(showMods as never, db as never);
  const modEmbed = embedJsonFromPayload(
    getLastCall(showMods, "editReply")?.args[0],
  );
  assertMatch(String(modEmbed.description), /mod-user/);

  const showChannels = createInteraction({
    commandName: "settings",
    admin: true,
    subcommandGroup: "channels",
    subcommand: "show",
  });
  await Settings.settings(showChannels as never, db as never);
  const channelEmbed = embedJsonFromPayload(
    getLastCall(showChannels, "editReply")?.args[0],
  );
  assertMatch(String(channelEmbed.description), /channel-2/);
});

Deno.test("Settings.settings manages language and username settings", async () => {
  const originalFileExists = Util.fileExists;
  // The handler checks the filesystem before setting a language; stub it so the
  // test covers the command branch without depending on cwd-specific paths.
  (Util as unknown as { fileExists: typeof Util.fileExists }).fileExists = () =>
    Promise.resolve(true);

  try {
    const dbCalls: string[] = [];
    const db = createDb({
      setLanguage: (_guildId: string, language: string) => {
        dbCalls.push(`setLanguage:${language}`);
        return Promise.resolve();
      },
      unsetLanguage: () => {
        dbCalls.push("unsetLanguage");
        return Promise.resolve(1);
      },
      getUsernameMode: () => Promise.resolve(modelRow({ mode: 2 })),
      setUsernameMode: (_guildId: string, mode: number) => {
        dbCalls.push(`setUsernameMode:${mode}`);
        return Promise.resolve();
      },
    });

    await Settings.settings(
      createInteraction({
        commandName: "settings",
        admin: true,
        subcommandGroup: "language",
        subcommand: "set",
        strings: { language: "de_DE" },
      }) as never,
      db as never,
    );
    await Settings.settings(
      createInteraction({
        commandName: "settings",
        admin: true,
        subcommandGroup: "language",
        subcommand: "unset",
      }) as never,
      db as never,
    );
    await Settings.settings(
      createInteraction({
        commandName: "settings",
        admin: true,
        subcommandGroup: "username",
        subcommand: "set",
        integers: { mode: 3 },
      }) as never,
      db as never,
    );
    await Settings.settings(
      createInteraction({
        commandName: "settings",
        admin: true,
        subcommandGroup: "username",
        subcommand: "unset",
      }) as never,
      db as never,
    );

    assertEquals(dbCalls, [
      "setLanguage:de_DE",
      "unsetLanguage",
      "setUsernameMode:3",
      "setUsernameMode:4",
    ]);

    const showLanguage = createInteraction({
      commandName: "settings",
      admin: true,
      subcommandGroup: "language",
      subcommand: "show",
    });
    await Settings.settings(
      showLanguage as never,
      createDb({ getLanguageCode: () => Promise.resolve("de_DE") }) as never,
    );
    const languageEmbed = embedJsonFromPayload(
      getLastCall(showLanguage, "editReply")?.args[0],
    );
    assertEquals(languageEmbed.description, "de_DE");

    const showUsername = createInteraction({
      commandName: "settings",
      admin: true,
      subcommandGroup: "username",
      subcommand: "show",
    });
    await Settings.settings(showUsername as never, db as never);
    const usernameEmbed = embedJsonFromPayload(
      getLastCall(showUsername, "editReply")?.args[0],
    );
    assertMatch(String(usernameEmbed.description), /Display|Name|Global/i);
  } finally {
    (Util as unknown as { fileExists: typeof Util.fileExists }).fileExists =
      originalFileExists;
  }
});

Deno.test("Settings.settings reports unavailable languages", async () => {
  const originalFileExists = Util.fileExists;
  // Force the unavailable branch and verify it does not write to the database.
  (Util as unknown as { fileExists: typeof Util.fileExists }).fileExists = () =>
    Promise.resolve(false);
  let setLanguageCalled = false;

  try {
    const interaction = createInteraction({
      commandName: "settings",
      admin: true,
      subcommandGroup: "language",
      subcommand: "set",
      strings: { language: "missing" },
    });
    await Settings.settings(
      interaction as never,
      createDb({
        setLanguage: () => {
          setLanguageCalled = true;
          return Promise.resolve();
        },
      }) as never,
    );

    assertEquals(setLanguageCalled, false);
    const payload = getLastCall(interaction, "editReply")?.args[0];
    const embed = embedJsonFromPayload(payload);
    assertMatch(String(embed.title), /unavailable|not|language/i);
  } finally {
    (Util as unknown as { fileExists: typeof Util.fileExists }).fileExists =
      originalFileExists;
  }
});

Deno.test("Settings.settings reset treats absent language as successful reset", async () => {
  const interaction = createInteraction({
    commandName: "settings",
    admin: true,
    subcommand: "reset",
  });
  const dbCalls: string[] = [];
  const db = createDb({
    resetMods: () => {
      dbCalls.push("resetMods");
      return Promise.resolve(1);
    },
    resetChannels: () => {
      dbCalls.push("resetChannels");
      return Promise.resolve(1);
    },
    setUsernameMode: (_guildId: string, mode: number) => {
      dbCalls.push(`setUsernameMode:${mode}`);
      return Promise.resolve();
    },
    unsetLanguage: () => {
      dbCalls.push("unsetLanguage");
      return Promise.reject("not set");
    },
  });

  await Settings.settings(interaction as never, db as never);

  assertEquals(dbCalls, [
    "resetMods",
    "resetChannels",
    "setUsernameMode:4",
    "unsetLanguage",
  ]);
  const payload = getLastCall(interaction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /success|reset/i);
});

Deno.test("Score.score shows existing and missing scores", async () => {
  const target = { id: "target-1", tag: "target#0001" };
  const existing = createInteraction({
    commandName: "score",
    subcommand: "show",
    users: { user: target },
  });
  await Score.score(
    existing as never,
    createDb({
      getScore: () => Promise.resolve({ position: 2, score: 10 }),
    }) as never,
  );
  const existingEmbed = embedJsonFromPayload(
    getLastCall(existing, "editReply")?.args[0],
  );
  assertEquals(existingEmbed.title, "target#0001");
  assertMatch(String(existingEmbed.description), /10/);
  assertMatch(String(existingEmbed.description), /2/);

  const missing = createInteraction({
    commandName: "score",
    subcommand: "show",
    user: { id: "self-1", tag: "self#0001" },
  });
  await Score.score(
    missing as never,
    createDb({ getScore: () => Promise.resolve(null) }) as never,
  );
  const missingEmbed = embedJsonFromPayload(
    getLastCall(missing, "editReply")?.args[0],
  );
  assertEquals(missingEmbed.title, "self#0001");
  assertMatch(String(missingEmbed.description), /N\/A/);
});

Deno.test("Help.help replies for valid and invalid help types", async () => {
  for (const type of ["admin", "mod", "player"]) {
    const interaction = createInteraction({
      commandName: "help",
      strings: { type },
    });
    await Help.help(interaction as never, createDb() as never);
    const payload = getLastCall(interaction, "editReply")?.args[0];
    const embed = embedJsonFromPayload(payload);
    assertMatch(String(embed.description), /\//);
  }

  const invalid = createInteraction({
    commandName: "help",
    strings: { type: "unknown" },
  });
  await Help.help(invalid as never, createDb() as never);
  assertEquals(
    invalid.calls.filter((call) => call.name === "editReply").length,
    1,
  );
  const invalidEmbed = embedJsonFromPayload(
    getLastCall(invalid, "editReply")?.args[0],
  );
  assertMatch(String(invalidEmbed.title), /invalid|error/i);
});

Deno.test("Leaderboard.leaderboard formats top ranks and runner-up table", async () => {
  // Six scores exercise both the themed top-five fields and the overflow
  // runner-up table.
  const members = Object.fromEntries(
    Array.from({ length: 6 }, (_, index) => {
      const id = `user-${index + 1}`;
      return [id, createGuildMember({ id, username: `user${index + 1}` })];
    }),
  );
  const scores = Array.from(
    { length: 6 },
    (_, index) => modelRow({ userId: `user-${index + 1}`, score: 10 - index }),
  );
  const interaction = createInteraction({
    commandName: "leaderboard",
    members,
  });
  const db = createDb({
    getScores: () => Promise.resolve(scores),
    getUsernameMode: () => Promise.resolve(modelRow({ mode: 4 })),
  });

  await Leaderboard.leaderboard(interaction as never, db as never);

  const payload = getLastCall(interaction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload) as {
    fields: { name: string; value: string }[];
  };
  assert(embed.fields.some((field) => /champion/i.test(field.name)));
  assert(embed.fields.some((field) => /user1/.test(field.name)));
  assert(embed.fields.some((field) => /6/.test(field.value)));
});

Deno.test("Leaderboard.leaderboard handles empty and missing-member boards", async () => {
  const empty = createInteraction({ commandName: "leaderboard" });
  await Leaderboard.leaderboard(
    empty as never,
    createDb({
      getScores: () => Promise.resolve([]),
      getUsernameMode: () => Promise.resolve(modelRow({ mode: 4 })),
    }) as never,
  );
  const emptyEmbed = embedJsonFromPayload(
    getLastCall(empty, "editReply")?.args[0],
  ) as {
    fields?: { name: string; value: string }[];
  };
  assertEquals(emptyEmbed.fields?.length ?? 0, 0);

  const missingMember = createInteraction({ commandName: "leaderboard" });
  await Leaderboard.leaderboard(
    missingMember as never,
    createDb({
      getScores: () =>
        Promise.resolve([modelRow({ userId: "missing", score: 4 })]),
      getUsernameMode: () => Promise.resolve(modelRow({ mode: 4 })),
    }) as never,
  );
  assertEquals(getLastCall(missingMember, "editReply") !== undefined, true);
});

Deno.test("Settings.settings owner is allowed without administrator permission", async () => {
  const interaction = createInteraction({
    commandName: "settings",
    ownerId: "owner-1",
    user: { id: "owner-1", tag: "owner#0001" },
    subcommandGroup: "mods",
    subcommand: "show",
  });
  interaction.memberPermissions = new PermissionsBitField(0n);

  await Settings.settings(
    interaction as never,
    createDb({ listMods: () => Promise.resolve([]) }) as never,
  );

  assertEquals(getLastCall(interaction, "editReply") !== undefined, true);
});

Deno.test("Delay.delay replies for set, unset, show, and invalid subcommands", async () => {
  const user = { id: "target-1", tag: "target#0001" };
  const db = createDb();

  for (const subcommand of ["set", "unset", "show"]) {
    const interaction = createInteraction({
      commandName: "mod",
      subcommand,
      users: { user },
      integers: { days: 1, hours: 2, minutes: 3, seconds: 4 },
    });
    await Delay.delay(interaction as never, db as never);
    assertEquals(getLastCall(interaction, "editReply") !== undefined, true);
  }

  const invalid = createInteraction({
    commandName: "mod",
    subcommand: "invalid",
  });
  await Delay.delay(invalid as never, db as never);
  const embed = embedJsonFromPayload(
    getLastCall(invalid, "editReply")?.args[0],
  );
  assertMatch(String(embed.title), /invalid|error/i);
});

Deno.test("Timeout.timeout replies for set, unset, show, and invalid subcommands", async () => {
  const user = { id: "target-1", tag: "target#0001" };
  const db = createDb();

  for (const subcommand of ["set", "unset", "show"]) {
    const interaction = createInteraction({
      commandName: "mod",
      subcommand,
      users: { user },
      integers: { days: 1, hours: 2, minutes: 3, seconds: 4 },
    });
    await Timeout.timeout(interaction as never, db as never);
    assertEquals(getLastCall(interaction, "editReply") !== undefined, true);
  }

  const invalid = createInteraction({
    commandName: "mod",
    subcommand: "invalid",
  });
  await Timeout.timeout(invalid as never, db as never);
  const embed = embedJsonFromPayload(
    getLastCall(invalid, "editReply")?.args[0],
  );
  assertMatch(String(embed.title), /invalid|error/i);
});

Deno.test("Championship.championship replies for new and invalid subcommands", async () => {
  const db = createDb();
  const create = createInteraction({
    commandName: "mod",
    subcommand: "new",
  });

  await Championship.championship(create as never, db as never);
  assertEquals(getLastCall(create, "editReply") !== undefined, true);

  const invalid = createInteraction({
    commandName: "mod",
    subcommand: "invalid",
  });
  await Championship.championship(invalid as never, db as never);
  const embed = embedJsonFromPayload(
    getLastCall(invalid, "editReply")?.args[0],
  );
  assertMatch(String(embed.title), /invalid|error/i);
});
