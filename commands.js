import { SlashCommandBuilder } from "discord.js";

export function getRegisterArray() {
  return [
    new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Responds with a pong"),
    new SlashCommandBuilder()
      .setName("showconfig")
      .setDescription("Shows the current configuration"),
    new SlashCommandBuilder()
      .setName("resetconfig")
      .setDescription("Resets the current configuration"),
    new SlashCommandBuilder()
      .setName("addrole")
      .setDescription("Add an authorized role to the configuration")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("The role you want to add to the configuration")
          .setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("removerole")
      .setDescription("Removes an authorized role from the configuration")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("The role you want to remove from the configuration")
          .setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("addchannel")
      .setDescription("Adds an authorized channel to the configuration")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel you want to add to the configuration")
          .setRequired(true),
      ),
    new SlashCommandBuilder()
      .setName("removechannel")
      .setDescription("Removes an authorized channel from the configuration")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "The channel you want to remove from the configuration",
          )
          .setRequired(true),
      ),
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
