import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from "./util";

export default class Championship {
  static async championship(
    interaction: ChatInputCommandInteraction,
    db: Database,
  ) {
    const lang = await Language.getLanguage(interaction.guildId!, db);
    let subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "new":
        try {
          await Championship.newChampionship(interaction.guildId!);
          await Util.editReply(
            interaction,
            lang.obj["mod_championship_new_title_success"],
            lang.obj["mod_championship_new_description_success"],
            lang,
          );
        } catch (err) {
          await Util.editReply(
            interaction,
            lang.obj["mod_championship_new_title_failed"],
            lang.obj["mod_championship_new_description_failed"],
            lang,
          );
        }
        break;
      default:
        await Util.editReply(
          interaction,
          lang.obj["error_invalid_subcommand_title"],
          lang.obj["error_invalid_subcommand_description"]
            .replace("<commandName>", interaction.commandName)
            .replace("<subcommandName>", subcommand),
          lang,
        );
    }
  }

  private static async newChampionship(serverId: string) {
    // TODO: Execute newChampionship Actions
  }

  static getRegisterObject(
    subcommandgroup: SlashCommandSubcommandGroupBuilder,
  ): SlashCommandSubcommandGroupBuilder {
    return subcommandgroup
      .setName("championship")
      .setNameLocalizations({
        de: "meisterschaft",
      })
      .setDescription("Manages the championship")
      .setDescriptionLocalizations({
        de: "Meisterschaft verwalten",
      })
      .addSubcommand((subcommand) =>
        subcommand
          .setName("new")
          .setNameLocalizations({
            de: "neu",
          })
          .setDescription(
            "Outputs the leaderboard one last time, reveals winner and clears the leaderboard",
          )
          .setDescriptionLocalizations({
            de: "Gibt die Bestenliste ein letztes Mal aus, verkündet den Gewinner und leert die Bestenliste",
          }),
      );
  }
}