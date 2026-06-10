/**
 * Verifies that the command facade exposes the complete slash-command registry.
 */
import { assertEquals } from "@std/assert";
import Commands from "../src/commands.ts";

const EXPECTED_COMMANDS = [
  "explore",
  "help",
  "leaderboard",
  "lightning",
  "mod",
  "reveal",
  "score",
  "settings",
];

Deno.test("Commands.getRegisterArray registers all slash commands", () => {
  const commands = Commands.getRegisterArray();

  assertEquals(commands.length, EXPECTED_COMMANDS.length);

  const names = commands.map((command) => command.name).sort();
  assertEquals(names, [...EXPECTED_COMMANDS].sort());
});
