import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import Database from "./data/postgres.ts";
import Language from "./language.ts";
import Util from "./util.ts";
import enLocalizations from "./languages/slash-commands/en.json" with {
  type: "json",
};
import deLocalizations from "./languages/slash-commands/de.json" with {
  type: "json",
};

export default class Championship {
  static async championship(
    interaction: ChatInputCommandInteraction,
    db: Database,
  ) {
    const lang = await Language.getLanguage(interaction.guildId!, db);
    const subcommand = interaction.options.getSubcommand();
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
          console.error(err);
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

  private static newChampionship(serverId: string) {
    // TODO: Make async when there is an actual logic
    console.log(`TODO: Execute newChampionship Actions for server ${serverId}`);
  }

  static getRegisterObject(
    subcommandgroup: SlashCommandSubcommandGroupBuilder,
  ): SlashCommandSubcommandGroupBuilder {
    return subcommandgroup
      .setName(enLocalizations.championship_name)
      .setNameLocalizations({
        de: deLocalizations.championship_name,
      })
      .setDescription(enLocalizations.championship_description)
      .setDescriptionLocalizations({
        de: deLocalizations.championship_description,
      })
      .addSubcommand((subcommand) =>
        subcommand
          .setName(enLocalizations.championship_new_name)
          .setNameLocalizations({
            de: deLocalizations.championship_new_name,
          })
          .setDescription(enLocalizations.championship_new_description)
          .setDescriptionLocalizations({
            de: deLocalizations.championship_new_description,
          })
      );
  }
}
