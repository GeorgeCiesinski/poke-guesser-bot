import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Util from "./util";
import Language from "./language";
import Database from "./data/postgres";
import enLocalizations from "./languages/slash-commands/en.json";
import deLocalizations from "./languages/slash-commands/de.json";

export default class Help {
  static async help(interaction: ChatInputCommandInteraction, db: Database) {
    await interaction.deferReply({ ephemeral: true }); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    const type = interaction.options.getString("type");
    let title = "";
    let description = "";
    switch (type) {
      case "admin":
        title = lang.obj["help_admin_title"];
        description =
          `\`/settings mods add <role or user>\` - ${lang.obj["help_settings_mods_add"]}\n` +
          `\`/settings mods remove <role or user>\` - ${lang.obj["help_settings_mods_remove"]}\n` +
          `\`/settings mods show\` - ${lang.obj["help_settings_mods_show"]}\n` +
          `\`/settings mods help\` - ${lang.obj["help_settings_mods_help"]}\n` +
          `\`/settings channels add <channel>\` - ${lang.obj["help_settings_channels_add"]}\n` +
          `\`/settings channels remove <channel>\` - ${lang.obj["help_settings_channels_remove"]}\n` +
          `\`/settings channels show\` - ${lang.obj["help_settings_channels_show"]}\n` +
          `\`/settings channels help\` - ${lang.obj["help_settings_channels_help"]}\n` +
          `\`/settings show\` - ${lang.obj["help_settings_show"]}\n` +
          `\`/settings reset\` - ${lang.obj["help_settings_reset"]}\n` +
          `\`/settings help\` - ${lang.obj["help_settings_help"]}\n`;
        break;
      case "mod":
        title = lang.obj["help_mod_title"];
        description =
          `\`/explore\` - ${lang.obj["help_explore"]}\n` +
          `\`/reveal\` - ${lang.obj["help_reveal"]}\n` +
          `\`/mod score add <user> [<score>]\` - ${lang.obj["help_mod_score_add"]}\n` +
          `\`/settings mods help\` - ${lang.obj["help_settings_mods_help"]}\n` +
          `\`/mod score remove <user> [<score>]\` - ${lang.obj["help_mod_score_remove"]}\n` +
          `\`/mod score set <user> [<score>]\` - ${lang.obj["help_mod_score_set"]}\n` +
          `\`/mod delay set <user> <delay>\` - ${lang.obj["help_mod_delay_set"]}\n` +
          `\`/mod delay unset <user>\` - ${lang.obj["help_mod_delay_unset"]}\n` +
          `\`/mod delay show <user>\` - ${lang.obj["help_mod_delay_show"]}\n` +
          `\`/mod timeout set <user> <timeout>\` - ${lang.obj["help_mod_timeout_set"]}\n` +
          `\`/mod timeout unset <user>\` - ${lang.obj["help_mod_timeout_unset"]}\n` +
          `\`/mod timeout show <user>\` - ${lang.obj["help_mod_timeout_show"]}\n` +
          `\`/mod championship new\` - ${lang.obj["help_mod_championship_new"]}\n`;
        break;
      case "player":
        title = lang.obj["help_player_title"];
        description =
          `\`/catch <pokemon>\` - ${lang.obj["help_catch"]}\n` +
          `\`/leaderboard\` - ${lang.obj["help_leaderboard"]}\n` +
          `\`/score show [<user>]\` - ${lang.obj["help_score_show"]}\n`;
        break;
      default:
        await Util.editReply(
          interaction,
          lang.obj["error_invalid_subcommand_title"],
          lang.obj["error_invalid_subcommand_description"]
            .replace("<commandName>", interaction.commandName)
            .replace("<subcommandName>", type ? type : "null"),
          lang,
        );
    }
    Util.editReply(interaction, title, description, lang);
  }

  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName(enLocalizations.help_name)
      .setNameLocalizations({
        de: deLocalizations.help_name,
      })
      .setDescription(enLocalizations.help_description)
      .setDescriptionLocalizations({
        de: deLocalizations.help_description,
      })
      .addStringOption((option) =>
        option
          .setName(enLocalizations.help_type_name)
          .setNameLocalizations({
            de: deLocalizations.help_type_name,
          })
          .setDescription(enLocalizations.help_type_description)
          .setDescriptionLocalizations({
            de: deLocalizations.help_type_description,
          })
          .setRequired(true)
          .setChoices(
            {
              name: enLocalizations.help_type_admin_name,
              name_localizations: {
                de: deLocalizations.help_type_admin_name,
              },
              value: "admin",
            },
            {
              name: enLocalizations.help_type_mod_name,
              name_localizations: {
                de: deLocalizations.help_type_mod_name,
              },
              value: "mod",
            },
            {
              name: enLocalizations.help_type_player_name,
              name_localizations: {
                de: deLocalizations.help_type_player_name,
              },
              value: "player",
            },
          ),
      );
  }
}
