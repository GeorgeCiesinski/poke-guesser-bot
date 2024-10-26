import { SlashCommandBuilder } from "discord.js";

export function getRegisterArray() {
  return [
    new SlashCommandBuilder()
      .setName("explore")
      .setDescription("Generate a new pokemon"),
    new SlashCommandBuilder()
      .setName("reveal")
      .setDescription("Reveals the current pokemon"),
    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("Shows the Leaderboard"),
    new SlashCommandBuilder()
      .setName("mod")
      .setDescription("Manage delay, timeout and score")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("score")
          .setDescription("Manage the score or someone")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("The user whose score you want to update")
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName("action")
              .setDescription(
                "The action you want to take (add, remove or set)",
              )
              .setChoices(
                {
                  name: "add",
                  value: "add",
                },
                {
                  name: "remove",
                  value: "remove",
                },
                {
                  name: "set",
                  value: "set",
                },
              )
              .setRequired(true),
          )
          .addIntegerOption((option) =>
            option
              .setName("amount")
              .setDescription(
                "The amount of points you want to add/remove/set from the user's score",
              )
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("newchampionship")
          .setDescription("Starts a new championship"),
      ),
  ];
}
