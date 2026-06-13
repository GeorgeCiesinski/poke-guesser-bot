/**
 * Tests dynamic language loading for configured guild language codes.
 */
import { assertEquals, assertExists } from "@std/assert";
import Database from "../src/data/postgres.ts";
import Language from "../src/language.ts";
import deDE from "../src/languages/de_DE.json" with { type: "json" };
import enUS from "../src/languages/en_US.json" with { type: "json" };

function createLanguageDb(languageCode: string): Database {
  return {
    getLanguageCode: () => Promise.resolve(languageCode),
  } as unknown as Database;
}

Deno.test("Language.getLanguage loads English strings by default", async () => {
  const lang = await Language.getLanguage("guild-1", createLanguageDb("en_US"));

  assertEquals(lang.code, "en_US");
  assertEquals(lang.obj.help_player_title, enUS.help_player_title);
  assertEquals(lang.obj.embed_author_name, enUS.embed_author_name);
});

Deno.test("Language.getLanguage loads German strings when configured", async () => {
  const lang = await Language.getLanguage("guild-2", createLanguageDb("de_DE"));

  assertEquals(lang.code, "de_DE");
  assertExists(lang.obj.help_player_title);
  assertEquals(lang.obj.help_player_title, deDE.help_player_title);
});
