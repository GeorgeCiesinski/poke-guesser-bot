import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from "./util";

export default class Delay {
  static async delay(interaction: ChatInputCommandInteraction, db: Database) {
    if (!interaction.guild?.available) {
      await interaction.reply({
        content:
          "Guild not available  (delay -> delay -> interaction.guild.available is either null or false)",
        ephemeral: true,
      });
      return;
    }
    if (!interaction.guildId) {
      await interaction.reply({
        content:
          "Internal Server Error (delay -> delay -> interaction.guildId = null)",
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply({ ephemeral: false }); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId, db);
    let subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "set":
        try {
          let d = interaction.options.getInteger("days", false) || 0;
          let h = interaction.options.getInteger("hours", false) || 0;
          let m = interaction.options.getInteger("minutes", false) || 0;
          let s = interaction.options.getInteger("seconds", false) || 0;
          let user = interaction.options.getUser("user");
          if (user) {
            await Delay.setDelay(interaction.guildId, user.id, d, h, m, s);
            await Util.editReply(
              interaction,
              lang.obj["mod_delay_set_title_success"],
              lang.obj["mod_delay_set_description_success"],
              lang
            );
          }
        } catch (err) {
          Util.editReply(
            interaction,
            lang.obj["mod_delay_set_title_failed"],
            `${lang.obj["mod_delay_set_description_failed"]}${err}`,
            lang
          );
        }
        break;
      case "unset":
        try {
          let user = interaction.options.getUser("user");
          if (user) {
            await Delay.unsetDelay(interaction.guildId, user.id);
            await Util.editReply(
              interaction,
              lang.obj["mod_delay_unset_title_success"],
              lang.obj["mod_delay_unset_description_success"],
              lang
            );
          }
        } catch (err) {
          await Util.editReply(
            interaction,
            lang.obj["mod_delay_unset_title_failed"],
            `${lang.obj["mod_delay_unset_description_failed"]}${err}`,
            lang
          );
        }
        break;
      case "show":
        try {
          let user = interaction.options.getUser("user");
          if (user) {
            await Delay.showDelay(interaction.guildId, user.id);
            await Util.editReply(
              interaction,
              lang.obj["mod_delay_show_title_success"],
              lang.obj["mod_delay_show_description_success"],
              lang
            );
          }
        } catch (err) {
          await Util.editReply(
            interaction,
            lang.obj["mod_delay_show_title_failed"],
            `${lang.obj["mod_delay_show_description_failed"]}${err}`,
            lang
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
          lang
        );
    }
  }

  private static async setDelay(
    serverId: string,
    userId: string,
    days: number = 0,
    hours: number = 0,
    minutes: number = 0,
    seconds: number = 0
  ) {
    // TODO: Execute Delay Actions
  }

  private static async unsetDelay(serverId: string, userId: string) {
    // TODO: Execute Delay Actions
  }

  private static async showDelay(serverId: string, userId: string) {
    // TODO: Execute Delay Actions
  }

  static getRegisterObject(
    subcommandgroup: SlashCommandSubcommandGroupBuilder
  ): SlashCommandSubcommandGroupBuilder {
    return subcommandgroup
      .setName("delay")
      .setNameLocalizations({
        de: "verzoegerung",
      })
      .setDescription("Manage the delay of a user")
      .setDescriptionLocalizations({
        de: "Die Verzögerung eines Benutzers verwalten",
      })
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setNameLocalizations({
            de: "setzen",
          })
          .setDescription("Sets a users delay")
          .setDescriptionLocalizations({
            de: "Setzt eine Verzögerung eines Benutzers",
          })
          .addUserOption((option) =>
            option
              .setName("user")
              .setNameLocalizations({
                de: "benutzer",
              })
              .setDescription("The user whose delay you want to set")
              .setDescriptionLocalizations({
                de: "Der Benutzer dessen Verzögerung gesetzt werden soll",
              })
              .setRequired(true)
          )
          .addIntegerOption((option) =>
            option
              .setName("days")
              .setNameLocalizations({
                de: "tage",
              })
              .setDescription("The duration you want to set the delay to")
              .setDescriptionLocalizations({
                de: "Die Dauer, auf die du die Verzögerung setzen willst",
              })
          )
          .addIntegerOption((option) =>
            option
              .setName("hours")
              .setNameLocalizations({
                de: "stunden",
              })
              .setDescription("The duration you want to set the delay to")
              .setDescriptionLocalizations({
                de: "Die Dauer, auf die du die Verzögerung setzen willst",
              })
          )
          .addIntegerOption((option) =>
            option
              .setName("minutes")
              .setNameLocalizations({
                de: "minuten",
              })
              .setDescription("The duration you want to set the delay to")
              .setDescriptionLocalizations({
                de: "Die Dauer, auf die du die Verzögerung setzen willst",
              })
          )
          .addIntegerOption((option) =>
            option
              .setName("seconds")
              .setNameLocalizations({
                de: "sekunden",
              })
              .setDescription("The duration you want to set the delay to")
              .setDescriptionLocalizations({
                de: "Die Dauer, auf die du die Verzögerung setzen willst",
              })
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("unset")
          .setNameLocalizations({
            de: "entfernen",
          })
          .setDescription("Unsets a users delay")
          .setDescriptionLocalizations({
            de: "Entfernt die Verzögerung eines Benutzers",
          })
          .addUserOption((option) =>
            option
              .setName("user")
              .setNameLocalizations({
                de: "benutzer",
              })
              .setDescription("The user whose delay you want to unset")
              .setDescriptionLocalizations({
                de: "Der Benutzer dessen Verzögerung entfernt werden soll",
              })
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("show")
          .setNameLocalizations({
            de: "anzeigen",
          })
          .setDescription("Shows a users delay")
          .setDescriptionLocalizations({
            de: "Zeigt die Deuer der Verzögerung eines Benutzers an",
          })
          .addUserOption((option) =>
            option
              .setName("user")
              .setNameLocalizations({
                de: "benutzer",
              })
              .setDescription("The user whose delay you want to see")
              .setDescriptionLocalizations({
                de: "Der Benutzer dessen Verzögerung du sehen willst",
              })
              .setRequired(true)
          )
      );
  }
}
