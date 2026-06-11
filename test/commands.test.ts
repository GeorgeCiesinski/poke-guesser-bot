/**
 * Verifies that the command facade exposes the complete slash-command registry
 * and the most important command shape contracts.
 */
import { assert, assertEquals } from "@std/assert";
import Commands from "../src/commands.ts";
import deLocalizations from "../src/languages/slash-commands/de.json" with {
  type: "json",
};

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

type CommandJson = {
  name: string;
  name_localizations?: Record<string, string>;
  options?: CommandOptionJson[];
};

type CommandOptionJson = {
  name: string;
  description?: string;
  required?: boolean;
  name_localizations?: Record<string, string>;
  description_localizations?: Record<string, string>;
  choices?: { name: string; value: string | number }[];
  options?: CommandOptionJson[];
};

function registryJson(): CommandJson[] {
  // Discord.js builders expose the stable command contract through JSON, which
  // is safer to assert than private builder internals.
  return Commands.getRegisterArray().map((command) =>
    command.toJSON() as CommandJson
  );
}

function commandByName(commands: CommandJson[], name: string) {
  const command = commands.find((entry) => entry.name === name);
  assert(command, `Expected command ${name} to be registered`);
  return command;
}

function optionByName(parent: { options?: CommandOptionJson[] }, name: string) {
  const option = parent.options?.find((entry) => entry.name === name);
  assert(option, `Expected option ${name} to exist`);
  return option;
}

Deno.test("Commands.getRegisterArray registers all slash commands", () => {
  const commands = Commands.getRegisterArray();

  assertEquals(commands.length, EXPECTED_COMMANDS.length);

  const names = commands.map((command) => command.name).sort();
  assertEquals(names, [...EXPECTED_COMMANDS].sort());
});

Deno.test("Commands.getRegisterArray includes German command localizations", () => {
  const commands = registryJson();

  for (const commandName of EXPECTED_COMMANDS) {
    const command = commandByName(commands, commandName);
    assert(command.name_localizations?.de);
  }
});

Deno.test("Help command registers required type choices", () => {
  const help = commandByName(registryJson(), "help");
  const typeOption = optionByName(help, "type");

  assertEquals(typeOption.required, true);
  assertEquals(
    typeOption.choices?.map((choice) => choice.value).sort(),
    ["admin", "mod", "player"],
  );
});

Deno.test("Score command registers show user option", () => {
  const score = commandByName(registryJson(), "score");
  const show = optionByName(score, "show");
  const user = optionByName(show, "user");

  assertEquals(user.required ?? false, false);
  assertEquals(show.name_localizations?.de, deLocalizations.score_show_name);
});

Deno.test("Mod command registers score action choices and grouped subcommands", () => {
  const mod = commandByName(registryJson(), "mod");
  const score = optionByName(mod, "score");
  const user = optionByName(score, "user");
  const action = optionByName(score, "action");
  const amount = optionByName(score, "amount");

  assertEquals(user.required, true);
  assertEquals(action.required, true);
  assertEquals(amount.required, true);
  assertEquals(
    action.choices?.map((choice) => choice.value).sort(),
    ["add", "remove", "set"],
  );

  for (const groupName of ["delay", "timeout", "championship"]) {
    assert(optionByName(mod, groupName));
  }
});

Deno.test("Settings command registers admin setting groups and root subcommands", () => {
  const settings = commandByName(registryJson(), "settings");

  for (const groupName of ["mods", "channels", "language", "username"]) {
    const group = optionByName(settings, groupName);
    assert(group.name_localizations?.de);
  }

  assert(optionByName(settings, "reset"));
  assert(optionByName(settings, "help"));
});

Deno.test("Delay command uses German seconds description localization", () => {
  const mod = commandByName(registryJson(), "mod");
  const delay = optionByName(mod, "delay");
  const set = optionByName(delay, "set");
  const seconds = optionByName(set, "seconds");

  assertEquals(
    seconds.description_localizations?.de,
    deLocalizations.delay_set_seconds_description,
  );
});

Deno.test("Lightning command registers required loop count", () => {
  const lightning = commandByName(registryJson(), "lightning");
  const start = optionByName(lightning, "start");
  const loops = optionByName(start, "loops");

  assertEquals(loops.required, true);
  assertEquals(
    start.name_localizations?.de,
    deLocalizations.lightning_start_name,
  );
});
