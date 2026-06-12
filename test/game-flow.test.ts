/**
 * Exercises the main Pokemon encounter lifecycle with fake Discord
 * interactions and mocked persistence/API calls.
 */
import { assert, assertEquals, assertMatch, assertRejects } from "@std/assert";
import Catch from "../src/catch.ts";
import Explore from "../src/explore.ts";
import Lightning from "../src/lightning.ts";
import Reveal from "../src/reveal.ts";
import Util from "../src/util.ts";
import {
  createDb,
  createGuildMember,
  createInteraction,
  createRole,
  embedJsonFromPayload,
  getLastCall,
  modelRow,
} from "./helpers.ts";

Deno.test("Catch.catchModalSubmitted handles correct English guesses", async () => {
  const btnInteraction = createInteraction({
    user: { id: "catcher-1", tag: "catcher#0001" },
  });
  const modalInteraction = createInteraction();
  Object.assign(modalInteraction, {
    fields: { getTextInputValue: () => "Pikachu" },
    user: { id: "catcher-1", tag: "catcher#0001" },
  });

  const dbCalls: string[] = [];
  const db = createDb({
    getEncounter: () =>
      Promise.resolve([
        modelRow({ name: "pikachu", language: "en" }),
        modelRow({ name: "pikachu", language: "de" }),
      ]),
    clearEncounters: () => {
      dbCalls.push("clearEncounters");
      return Promise.resolve(1);
    },
    getArtwork: () => Promise.resolve("https://example.com/pikachu.png"),
    addScore: (_guildId: string, userId: string, score: number) => {
      dbCalls.push(`addScore:${userId}:${score}`);
      return Promise.resolve();
    },
    unsetArtwork: () => {
      dbCalls.push("unsetArtwork");
      return Promise.resolve(1);
    },
  });

  const originalCheckLightning = Lightning.checkLightning;
  let lightningChecked = false;
  // Catch should trigger lightning continuation, but this unit test only needs
  // to verify the handoff instead of generating another encounter.
  (Lightning as unknown as {
    checkLightning: typeof Lightning.checkLightning;
  }).checkLightning = () => {
    lightningChecked = true;
    return Promise.resolve();
  };

  try {
    const result = await Catch.catchModalSubmitted(
      btnInteraction as never,
      modalInteraction as never,
      db as never,
    );

    assertEquals(result, true);
    assertEquals(dbCalls, [
      "clearEncounters",
      "addScore:catcher-1:1",
      "unsetArtwork",
    ]);
    assertEquals(lightningChecked, true);
    const payload = getLastCall(btnInteraction, "followUp")?.args[0];
    const embed = embedJsonFromPayload(payload);
    assertMatch(String(embed.title), /Pikachu/);
  } finally {
    (Lightning as unknown as {
      checkLightning: typeof Lightning.checkLightning;
    }).checkLightning = originalCheckLightning;
  }
});

Deno.test("Catch.catchModalSubmitted handles localized guesses", async () => {
  const btnInteraction = createInteraction({
    user: { id: "catcher-1", tag: "catcher#0001" },
  });
  const modalInteraction = createInteraction();
  Object.assign(modalInteraction, {
    fields: { getTextInputValue: () => "Bisasam" },
    user: { id: "catcher-1", tag: "catcher#0001" },
  });
  const db = createDb({
    getEncounter: () =>
      Promise.resolve([
        modelRow({ name: "bulbasaur", language: "en" }),
        modelRow({ name: "bisasam", language: "de" }),
      ]),
    clearEncounters: () => Promise.resolve(1),
    getArtwork: () => Promise.resolve(null),
    addScore: () => Promise.resolve(),
    unsetArtwork: () => Promise.resolve(1),
  });

  const originalCheckLightning = Lightning.checkLightning;
  (Lightning as unknown as {
    checkLightning: typeof Lightning.checkLightning;
  }).checkLightning = () => Promise.resolve();

  try {
    const result = await Catch.catchModalSubmitted(
      btnInteraction as never,
      modalInteraction as never,
      db as never,
    );

    assertEquals(result, true);
    const payload = getLastCall(btnInteraction, "followUp")?.args[0];
    const embed = embedJsonFromPayload(payload);
    assertMatch(String(embed.title), /Bulbasaur/);
    assertMatch(String(embed.title), /Bisasam/);
  } finally {
    (Lightning as unknown as {
      checkLightning: typeof Lightning.checkLightning;
    }).checkLightning = originalCheckLightning;
  }
});

Deno.test("Catch.catchModalSubmitted rejects incorrect guesses without clearing", async () => {
  const btnInteraction = createInteraction();
  const modalInteraction = createInteraction();
  Object.assign(modalInteraction, {
    fields: { getTextInputValue: () => "Raichu" },
  });
  let cleared = false;
  const db = createDb({
    getEncounter: () =>
      Promise.resolve([modelRow({ name: "pikachu", language: "en" })]),
    clearEncounters: () => {
      cleared = true;
      return Promise.resolve(1);
    },
  });

  const result = await Catch.catchModalSubmitted(
    btnInteraction as never,
    modalInteraction as never,
    db as never,
  );

  assertEquals(result, false);
  assertEquals(cleared, false);
  const payload = getLastCall(btnInteraction, "followUp")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /Incorrect|incorrect|guess/i);
});

Deno.test("Catch.catchModalSubmitted handles missing encounters", async () => {
  const btnInteraction = createInteraction();
  const modalInteraction = createInteraction();
  Object.assign(modalInteraction, {
    fields: { getTextInputValue: () => "Pikachu" },
  });
  const db = createDb({ getEncounter: () => Promise.resolve([]) });

  const result = await Catch.catchModalSubmitted(
    btnInteraction as never,
    modalInteraction as never,
    db as never,
  );

  assertEquals(result, false);
  const payload = getLastCall(btnInteraction, "followUp")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /encounter|Pok.mon|No/i);
});

Deno.test("Catch.catchModalSubmitted returns early for unavailable guilds", async () => {
  const btnInteraction = createInteraction();
  const modalInteraction = createInteraction();
  Object.assign(modalInteraction, {
    guild: { available: false },
    fields: { getTextInputValue: () => "Pikachu" },
  });
  let touchedDb = false;
  const db = createDb({
    getEncounter: () => {
      touchedDb = true;
      return Promise.resolve([]);
    },
  });

  const result = await Catch.catchModalSubmitted(
    btnInteraction as never,
    modalInteraction as never,
    db as never,
  );

  assertEquals(result, undefined);
  assertEquals(touchedDb, false);
});

Deno.test("Explore.explore starts encounters for direct moderators", async () => {
  const interaction = createInteraction({
    member: createGuildMember({ id: "mod-1" }),
  });
  const dbCalls: string[] = [];
  const db = createDb({
    isMod: () => Promise.resolve(true),
    clearEncounters: () => {
      dbCalls.push("clearEncounters");
      return Promise.resolve(1);
    },
    unsetArtwork: () => {
      dbCalls.push("unsetArtwork");
      return Promise.resolve(null);
    },
    addEncounter: (_guildId: string, _channelId: string, name: string) => {
      dbCalls.push(`addEncounter:${name}`);
      return Promise.resolve();
    },
    setArtwork: (_guildId: string, _channelId: string, artwork: string) => {
      dbCalls.push(`setArtwork:${artwork}`);
      return Promise.resolve();
    },
    setLastExplore: () => {
      dbCalls.push("setLastExplore");
      return Promise.resolve();
    },
  });

  const originals = {
    generatePokemon: Util.generatePokemon,
    fetchNames: Util.fetchNames,
    fetchSprite: Util.fetchSprite,
  };
  // Keep encounter generation deterministic and offline by replacing PokeAPI
  // helpers with fixed responses for this test.
  (Util as unknown as {
    generatePokemon: typeof Util.generatePokemon;
    fetchNames: typeof Util.fetchNames;
    fetchSprite: typeof Util.fetchSprite;
  }).generatePokemon = () =>
    Promise.resolve({
      name: "pikachu",
      url: "https://pokeapi.co/api/v2/pokemon/25/",
    });
  (Util as unknown as {
    fetchNames: typeof Util.fetchNames;
  }).fetchNames = () =>
    Promise.resolve([{ languageName: "en", languageUrl: "", name: "pikachu" }]);
  (Util as unknown as {
    fetchSprite: typeof Util.fetchSprite;
  }).fetchSprite = () =>
    Promise.resolve({
      front_default: "https://example.com/sprite.png",
      other: {
        official_artwork: { front_default: "https://example.com/art.png" },
      },
    } as never);

  try {
    await Explore.explore(interaction as never, db as never);

    assert(dbCalls.includes("clearEncounters"));
    assert(dbCalls.includes("addEncounter:25"));
    assert(dbCalls.includes("addEncounter:pikachu"));
    assert(dbCalls.includes("setArtwork:https://example.com/art.png"));
    assert(dbCalls.includes("setLastExplore"));
    const payload = getLastCall(interaction, "editReply")?.args[0] as {
      components: unknown[];
    };
    assertEquals(payload.components.length, 1);
  } finally {
    Object.assign(Util, originals);
  }
});

Deno.test("Explore.explore accepts role-based moderators", async () => {
  const role = createRole("role-mod");
  const interaction = createInteraction({
    member: createGuildMember({ roles: [role] }),
  });
  let checkedRole = false;
  const db = createDb({
    isMod: (mentionable: { id: string }) => {
      if (mentionable?.id === "role-mod") checkedRole = true;
      return Promise.resolve(mentionable?.id === "role-mod");
    },
    clearEncounters: () => Promise.resolve(1),
    unsetArtwork: () => Promise.resolve(null),
    addEncounter: () => Promise.resolve(),
    setArtwork: () => Promise.resolve(),
    setLastExplore: () => Promise.resolve(),
  });

  const originals = {
    generatePokemon: Util.generatePokemon,
    fetchNames: Util.fetchNames,
    fetchSprite: Util.fetchSprite,
  };
  (Util as unknown as {
    generatePokemon: typeof Util.generatePokemon;
  }).generatePokemon = () =>
    Promise.resolve({
      name: "eevee",
      url: "https://pokeapi.co/api/v2/pokemon/133/",
    });
  (Util as unknown as {
    fetchNames: typeof Util.fetchNames;
  }).fetchNames = () =>
    Promise.resolve([{ languageName: "en", languageUrl: "", name: "eevee" }]);
  (Util as unknown as {
    fetchSprite: typeof Util.fetchSprite;
  }).fetchSprite = () =>
    Promise.resolve({
      front_default: "sprite",
      other: { official_artwork: { front_default: "art" } },
    } as never);

  try {
    await Explore.explore(interaction as never, db as never);
    assertEquals(checkedRole, true);
    assertEquals(getLastCall(interaction, "editReply") !== undefined, true);
  } finally {
    Object.assign(Util, originals);
  }
});

Deno.test("Explore.explore denies non-moderators", async () => {
  const interaction = createInteraction({
    member: createGuildMember(),
  });
  let generated = false;
  const db = createDb({ isMod: () => Promise.resolve(false) });
  const originalGeneratePokemon = Util.generatePokemon;
  (Util as unknown as {
    generatePokemon: typeof Util.generatePokemon;
  }).generatePokemon = () => {
    generated = true;
    return Promise.resolve({ name: "pikachu", url: "" });
  };

  try {
    await Explore.explore(interaction as never, db as never);

    assertEquals(generated, false);
    const payload = getLastCall(interaction, "editReply")?.args[0];
    const embed = embedJsonFromPayload(payload);
    assertMatch(String(embed.title), /mod|permission|denied/i);
  } finally {
    (Util as unknown as {
      generatePokemon: typeof Util.generatePokemon;
    }).generatePokemon = originalGeneratePokemon;
  }
});

Deno.test("Explore.explore retries when species names are missing", async () => {
  const interaction = createInteraction({ member: createGuildMember() });
  const db = createDb({
    isMod: () => Promise.resolve(true),
    clearEncounters: () => Promise.resolve(1),
    unsetArtwork: () => Promise.resolve(null),
    addEncounter: () => Promise.resolve(),
  });
  const originalGeneratePokemon = Util.generatePokemon;
  const originalFetchNames = Util.fetchNames;
  (Util as unknown as {
    generatePokemon: typeof Util.generatePokemon;
  }).generatePokemon = () =>
    Promise.resolve({
      name: "form",
      url: "https://pokeapi.co/api/v2/pokemon/10001/",
    });
  (Util as unknown as {
    fetchNames: typeof Util.fetchNames;
  }).fetchNames = () => Promise.resolve(null);

  let retryPreventDefer: boolean | undefined;
  const originalExplore = Explore.explore;

  try {
    // Call with a fake `this` so the recursive retry can be observed without
    // actually recursing forever in the test process.
    await originalExplore.call(
      {
        explore: (_i: unknown, _db: unknown, preventDefer: boolean) => {
          retryPreventDefer = preventDefer;
        },
      },
      interaction as never,
      db as never,
    );

    assertEquals(retryPreventDefer, true);
  } finally {
    (Util as unknown as {
      generatePokemon: typeof Util.generatePokemon;
      fetchNames: typeof Util.fetchNames;
    }).generatePokemon = originalGeneratePokemon;
    (Util as unknown as {
      fetchNames: typeof Util.fetchNames;
    }).fetchNames = originalFetchNames;
  }
});

Deno.test("Explore.explore retries when front sprite is missing", async () => {
  const interaction = createInteraction({ member: createGuildMember() });
  const db = createDb({
    isMod: () => Promise.resolve(true),
    clearEncounters: () => Promise.resolve(1),
    unsetArtwork: () => Promise.resolve(null),
    addEncounter: () => Promise.resolve(),
  });
  const originals = {
    generatePokemon: Util.generatePokemon,
    fetchNames: Util.fetchNames,
    fetchSprite: Util.fetchSprite,
  };
  (Util as unknown as {
    generatePokemon: typeof Util.generatePokemon;
  }).generatePokemon = () =>
    Promise.resolve({
      name: "form",
      url: "https://pokeapi.co/api/v2/pokemon/10001/",
    });
  (Util as unknown as {
    fetchNames: typeof Util.fetchNames;
  }).fetchNames = () =>
    Promise.resolve([{ languageName: "en", languageUrl: "", name: "form" }]);
  (Util as unknown as {
    fetchSprite: typeof Util.fetchSprite;
  }).fetchSprite = () =>
    Promise.resolve({
      front_default: null,
      other: { official_artwork: { front_default: "art" } },
    } as never);

  let retryPreventDefer: boolean | undefined;
  const originalExplore = Explore.explore;

  try {
    // Missing sprites follow the same retry contract as missing names: reuse the
    // already-deferred interaction and restart encounter generation.
    await originalExplore.call(
      {
        explore: (_i: unknown, _db: unknown, preventDefer: boolean) => {
          retryPreventDefer = preventDefer;
        },
      },
      interaction as never,
      db as never,
    );

    assertEquals(retryPreventDefer, true);
  } finally {
    Object.assign(Util, originals);
  }
});

Deno.test("Reveal.reveal rejects non-moderators", async () => {
  const interaction = createInteraction({ member: createGuildMember() });
  const db = createDb({ isMod: () => Promise.resolve(false) });

  await Reveal.reveal(interaction as never, db as never);

  const payload = getLastCall(interaction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /mod|permission|denied/i);
});

Deno.test("Reveal.reveal handles missing encounters", async () => {
  const interaction = createInteraction({ member: createGuildMember() });
  const db = createDb({
    isMod: () => Promise.resolve(true),
    getEncounter: () => Promise.resolve([]),
  });

  await Reveal.reveal(interaction as never, db as never);

  const payload = getLastCall(interaction, "editReply")?.args[0];
  const embed = embedJsonFromPayload(payload);
  assertMatch(String(embed.title), /encounter|Pok.mon|No/i);
});

Deno.test("Reveal.reveal clears encounters and checks lightning", async () => {
  const interaction = createInteraction({ member: createGuildMember() });
  let cleared = false;
  const db = createDb({
    isMod: () => Promise.resolve(true),
    getEncounter: () =>
      Promise.resolve([
        modelRow({ name: "pikachu", language: "en" }),
        modelRow({ name: "pikachu", language: "de" }),
        modelRow({ name: "pikachu", language: "ja" }),
      ]),
    clearEncounters: () => {
      cleared = true;
      return Promise.resolve(1);
    },
  });

  const originalCheckLightning = Lightning.checkLightning;
  let lightningChecked = false;
  (Lightning as unknown as {
    checkLightning: typeof Lightning.checkLightning;
  }).checkLightning = () => {
    lightningChecked = true;
    return Promise.resolve();
  };

  try {
    await Reveal.reveal(interaction as never, db as never);

    assertEquals(cleared, true);
    assertEquals(lightningChecked, true);
    const payload = getLastCall(interaction, "editReply")?.args[0];
    const embed = embedJsonFromPayload(payload);
    assertMatch(String(embed.description), /Pikachu/);
  } finally {
    (Lightning as unknown as {
      checkLightning: typeof Lightning.checkLightning;
    }).checkLightning = originalCheckLightning;
  }
});

Deno.test("Lightning.lightning stores loop count and delegates to explore", async () => {
  const interaction = createInteraction({
    integers: { loops: 5 },
  });
  let storedLoops: number | undefined;
  const db = createDb({
    setLightningLoops: (
      _guildId: string,
      _channelId: string,
      loops: number,
    ) => {
      storedLoops = loops;
      return Promise.resolve();
    },
  });

  const originalExplore = Explore.explore;
  let delegated = false;
  // The lightning command delegates encounter creation to Explore; the details
  // of that flow are covered by Explore-specific tests above.
  (Explore as unknown as {
    explore: typeof Explore.explore;
  }).explore = () => {
    delegated = true;
    return Promise.resolve();
  };

  try {
    await Lightning.lightning(interaction as never, db as never);
    assertEquals(storedLoops, 4);
    assertEquals(delegated, true);
  } finally {
    (Explore as unknown as {
      explore: typeof Explore.explore;
    }).explore = originalExplore;
  }
});

Deno.test("Lightning.explore posts follow-up encounters without mod checks", async () => {
  const interaction = createInteraction();
  const dbCalls: string[] = [];
  const db = createDb({
    clearEncounters: () => {
      dbCalls.push("clearEncounters");
      return Promise.resolve(1);
    },
    unsetArtwork: () => {
      dbCalls.push("unsetArtwork");
      return Promise.resolve(null);
    },
    addEncounter: (_guildId: string, _channelId: string, name: string) => {
      dbCalls.push(`addEncounter:${name}`);
      return Promise.resolve();
    },
    setArtwork: () => {
      dbCalls.push("setArtwork");
      return Promise.resolve();
    },
    setLastExplore: () => {
      dbCalls.push("setLastExplore");
      return Promise.resolve();
    },
  });

  const originals = {
    generatePokemon: Util.generatePokemon,
    fetchNames: Util.fetchNames,
    fetchSprite: Util.fetchSprite,
  };
  (Util as unknown as {
    generatePokemon: typeof Util.generatePokemon;
  }).generatePokemon = () =>
    Promise.resolve({
      name: "mew",
      url: "https://pokeapi.co/api/v2/pokemon/151/",
    });
  (Util as unknown as {
    fetchNames: typeof Util.fetchNames;
  }).fetchNames = () =>
    Promise.resolve([{ languageName: "en", languageUrl: "", name: "mew" }]);
  (Util as unknown as {
    fetchSprite: typeof Util.fetchSprite;
  }).fetchSprite = () =>
    Promise.resolve({
      front_default: "sprite",
      other: { official_artwork: { front_default: "art" } },
    } as never);

  try {
    await Lightning.explore(interaction as never, db as never);

    assertEquals(dbCalls, [
      "clearEncounters",
      "unsetArtwork",
      "addEncounter:151",
      "addEncounter:mew",
      "setArtwork",
      "setLastExplore",
    ]);
    assertEquals(getLastCall(interaction, "followUp") !== undefined, true);
  } finally {
    Object.assign(Util, originals);
  }
});

Deno.test("Lightning.checkLightning continues and decrements active rounds", async () => {
  const interaction = createInteraction();
  let storedLoops: number | undefined;
  const db = createDb({
    getLightningLoops: () => Promise.resolve(2),
    setLightningLoops: (
      _guildId: string,
      _channelId: string,
      loops: number,
    ) => {
      storedLoops = loops;
      return Promise.resolve();
    },
    unsetLightningLoops: () => {
      throw new Error("should not unset");
    },
  });

  const originalExplore = Lightning.explore;
  let continued = false;
  let preventDefer: boolean | undefined;
  // Stub continuation so this test can focus on loop-count state changes.
  (Lightning as unknown as {
    explore: typeof Lightning.explore;
  }).explore = (_interaction, _db, receivedPreventDefer) => {
    continued = true;
    preventDefer = receivedPreventDefer;
    return Promise.resolve();
  };

  try {
    await Lightning.checkLightning(interaction as never, db as never);
    assertEquals(continued, true);
    assertEquals(preventDefer, true);
    assertEquals(storedLoops, 1);
  } finally {
    (Lightning as unknown as {
      explore: typeof Lightning.explore;
    }).explore = originalExplore;
  }
});

Deno.test("Lightning.checkLightning unsets final active round", async () => {
  const interaction = createInteraction();
  let unset = false;
  const db = createDb({
    getLightningLoops: () => Promise.resolve(1),
    setLightningLoops: () => {
      throw new Error("should not set");
    },
    unsetLightningLoops: () => {
      unset = true;
      return Promise.resolve(1);
    },
  });

  const originalExplore = Lightning.explore;
  let preventDefer: boolean | undefined;

  (Lightning as unknown as {
    explore: typeof Lightning.explore;
  }).explore = (_interaction, _db, receivedPreventDefer) => {
    preventDefer = receivedPreventDefer;
    return Promise.resolve()
  };

  try {
    await Lightning.checkLightning(interaction as never, db as never);
    assertEquals(preventDefer, true);
    assertEquals(unset, true);
  } finally {
    (Lightning as unknown as {
      explore: typeof Lightning.explore;
    }).explore = originalExplore;
  }
});

Deno.test("Lightning.checkLightning does nothing without active state", async () => {
  const interaction = createInteraction();
  const db = createDb({
    getLightningLoops: () => Promise.resolve(null),
    setLightningLoops: () => {
      throw new Error("should not set");
    },
    unsetLightningLoops: () => {
      throw new Error("should not unset");
    },
  });
  const originalExplore = Lightning.explore;
  (Lightning as unknown as {
    explore: typeof Lightning.explore;
  }).explore = () => {
    throw new Error("should not continue");
  };

  try {
    await Lightning.checkLightning(interaction as never, db as never);
  } finally {
    (Lightning as unknown as {
      explore: typeof Lightning.explore;
    }).explore = originalExplore;
  }
});

Deno.test("Lightning.checkLightning surfaces continuation failures", async () => {
  const interaction = createInteraction();
  const db = createDb({
    getLightningLoops: () => Promise.resolve(1),
  });
  const originalExplore = Lightning.explore;
  (Lightning as unknown as {
    explore: typeof Lightning.explore;
  }).explore = () => {
    throw new Error("boom");
  };

  try {
    await assertRejects(
      () => Lightning.checkLightning(interaction as never, db as never),
      Error,
      "boom",
    );
  } finally {
    (Lightning as unknown as {
      explore: typeof Lightning.explore;
    }).explore = originalExplore;
  }
});
