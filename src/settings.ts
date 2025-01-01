import {
  ChatInputCommandInteraction,
  GuildChannel,
  GuildMember,
  PermissionsBitField,
  Role,
  SlashCommandBuilder,
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

export default class Settings {
  static async settings(
    interaction: ChatInputCommandInteraction,
    db: Database,
  ): Promise<void> {
    await interaction.deferReply({ ephemeral: true }); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    // https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
    console.log(
      `Owner:${
        interaction.guild!.ownerId == interaction.user.id
      }; Administrator:${
        interaction.memberPermissions?.has(
          PermissionsBitField.Flags.Administrator,
          false,
        )
      }`,
    );
    if (
      interaction.guild!.ownerId != interaction.user.id /*Is Owner*/ &&
      !interaction.memberPermissions?.has(
        PermissionsBitField.Flags.Administrator,
        false,
      )
    ) {
      await Util.editReply(
        interaction,
        lang.obj["settings_command_forbidden_error_title"],
        lang.obj["settings_command_forbidden_error_description"],
        lang,
      );
      return;
    }
    const subcommandgroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "add": {
        switch (subcommandgroup) {
          case "mods": { // /settings mods add
            try {
              const mentionable = interaction.options.getMentionable(
                "mentionable",
              );
              if (mentionable) {
                await db.addMod(mentionable as GuildMember | Role);
                await Util.editReply(
                  interaction,
                  lang.obj["settings_mods_add_title_success"],
                  lang.obj["settings_mods_add_description_success"],
                  lang,
                );
              }
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_mods_add_title_failed"],
                `${lang.obj["settings_mods_add_description_failed"]}${err}`,
                lang,
              );
            }
            break;
          }
          case "channels": { // /settings channels add
            try {
              const channel = interaction.options.getChannel("channel");
              if (channel) {
                await db.addChannel(channel as GuildChannel);
                await Util.editReply(
                  interaction,
                  lang.obj["settings_channels_add_title_success"],
                  lang.obj["settings_channels_add_description_success"],
                  lang,
                );
              }
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_channels_add_title_failed"],
                `${lang.obj["settings_channels_add_description_failed"]}${err}`,
                lang,
              );
            }
            break;
          }
          default: {
            await Util.editReply(
              interaction,
              lang.obj["error_invalid_subcommand_title"],
              lang.obj["error_invalid_subcommand_description"]
                .replace("<commandName>", interaction.commandName)
                .replace(
                  "<subcommandName>",
                  subcommandgroup + " " + subcommand,
                ),
              lang,
            );
          }
        }
        break;
      }
      case "remove": {
        switch (subcommandgroup) {
          case "mods": { // /settings mods remove
            try {
              const mentionable = interaction.options.getMentionable(
                "mentionable",
              );
              if (mentionable) {
                await db.removeMod(mentionable as GuildMember | Role);
                await Util.editReply(
                  interaction,
                  lang.obj["settings_mods_remove_title_success"],
                  lang.obj["settings_mods_remove_description_success"],
                  lang,
                );
              }
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_mods_remove_title_failed"],
                `${lang.obj["settings_mods_remove_description_failed"]}${err}`,
                lang,
              );
            }
            break;
          }
          case "channels": { // /settings channels remove
            try {
              const channel = interaction.options.getChannel("channel");
              if (channel) {
                await db.removeChannel(channel as GuildChannel);
                await Util.editReply(
                  interaction,
                  lang.obj["settings_channels_remove_title_success"],
                  lang.obj["settings_channels_remove_description_success"],
                  lang,
                );
              }
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_channels_remove_title_failed"],
                `${
                  lang.obj["settings_channels_remove_description_failed"]
                }${err}`,
                lang,
              );
            }
            break;
          }
          default:
            await Util.editReply(
              interaction,
              lang.obj["error_invalid_subcommand_title"],
              lang.obj["error_invalid_subcommand_description"]
                .replace("<commandName>", interaction.commandName)
                .replace(
                  "<subcommandName>",
                  subcommandgroup + " " + subcommand,
                ),
              lang,
            );
        }
        break;
      }
      case "show": {
        let title = "";
        let description = "";
        switch (subcommandgroup) {
          case "mods": { // /settings mods show
            title = lang.obj["settings_mods_show_title"];
            const mods = await db.listMods(interaction.guildId!);
            for (let i = 0; i < mods.length; i++) {
              description += `<@${
                mods[i].getDataValue("isUser")
                  ? mods[i].getDataValue("mentionableId")
                  : "&" + mods[i].get("mentionableId")
              }> (${mods[i].get("mentionableId")})\n`;
            }
            if (description.length < 20) {
              description = lang.obj["settings_mods_show_none"];
            }
            break;
          }
          case "channels": { // /settings channels show
            title = lang.obj["settings_channels_show_title"];
            const channels = await db.listChannels(interaction.guildId!);
            for (let i = 0; i < channels.length; i++) {
              description += `<#${channels[i].get("channelId")}> (${
                channels[
                  i
                ].get("channelId")
              })\n`;
            }
            if (description.length < 20) {
              description = lang.obj["settings_channels_show_none"];
            }
            break;
          }
          case "language": { // /settings language show
            title = lang.obj["settings_language_show_title"];
            description = await db.getLanguageCode(interaction.guildId!);
            break;
          }
          case "username": { // /settings username show
            title = lang.obj["settings_username_show_title"];
            const usernameModeId = await db.getUsernameMode(
              interaction.guild!.id,
            );
            const usernameMode = Util.translateUsernameModeId(
              usernameModeId?.getDataValue("mode"),
              lang.obj,
            );
            description = usernameMode;
            break;
          }
          default: {
            title = lang.obj["error_invalid_subcommand_title"];
            description = lang.obj["error_invalid_subcommand_description"]
              .replace("<commandName>", interaction.commandName)
              .replace("<subcommandName>", subcommandgroup + " " + subcommand);
            break;
          }
        }
        await Util.editReply(interaction, title, description, lang);
        break;
      }
      case "set":
        switch (subcommandgroup) {
          case "language": { // /settings language set
            try {
              const language = interaction.options.getString("language");
              if (language) {
                if (/*TODO*/ fs.existsSync(`./languages/${language}.json`)) {
                  await db.setLanguage(interaction.guild!.id, language);
                  await Util.editReply(
                    interaction,
                    lang.obj["settings_language_set_title_success"],
                    lang.obj["settings_language_set_description_success"],
                    lang,
                  );
                } else {
                  await Util.editReply(
                    interaction,
                    lang.obj["settings_language_set_title_unavailable"],
                    lang.obj["settings_language_set_description_unavailable"],
                    lang,
                  );
                }
              }
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_language_set_title_failed"],
                `${lang.obj["settings_language_set_description_failed"]}${err}`,
                lang,
              );
            }
            break;
          }
          case "username": { // /settings username set
            try {
              const mode = interaction.options.getInteger("mode");
              if (mode != undefined && mode != null) {
                await db.setUsernameMode(interaction.guildId!, mode);
                await Util.editReply(
                  interaction,
                  lang.obj["settings_username_set_title_success"],
                  lang.obj["settings_username_set_description_success"],
                  lang,
                );
              } else {
                await Util.editReply(
                  interaction,
                  lang.obj["settings_username_set_title_failed"],
                  `${
                    lang.obj["settings_username_set_description_failed"]
                  }mode = ${mode}`,
                  lang,
                );
              }
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_username_set_title_failed"],
                `${lang.obj["settings_username_set_description_failed"]}${err}`,
                lang,
              );
            }
            break;
          }
          default: {
            await Util.editReply(
              interaction,
              lang.obj["error_invalid_subcommand_title"],
              lang.obj["error_invalid_subcommand_description"]
                .replace("<commandName>", interaction.commandName)
                .replace(
                  "<subcommandName>",
                  subcommandgroup + " " + subcommand,
                ),
              lang,
            );
            break;
          }
        }
        break;
      case "unset":
        switch (subcommandgroup) {
          case "language": { // /settings language unset
            try {
              await db.unsetLanguage(interaction.guildId!);
              await Util.editReply(
                interaction,
                lang.obj["settings_language_unset_title_success"],
                lang.obj["settings_language_unset_description_success"],
                lang,
              );
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_language_unset_title_failed"],
                `${
                  lang.obj["settings_language_unset_description_failed"]
                }: ${err}`,
                lang,
              );
            }
            break;
          }
          case "username": { // /settings username unset
            try {
              await db.setUsernameMode(interaction.guildId!, 4);
              await Util.editReply(
                interaction,
                lang.obj["settings_username_unset_title_success"],
                lang.obj["settings_username_unset_description_success"],
                lang,
              );
            } catch (err) {
              await Util.editReply(
                interaction,
                lang.obj["settings_username_unset_title_failed"],
                `${
                  lang.obj["settings_username_unset_description_failed"]
                }: ${err}`,
                lang,
              );
            }
            break;
          }
          default: {
            await Util.editReply(
              interaction,
              lang.obj["error_invalid_subcommand_title"],
              lang.obj["error_invalid_subcommand_description"]
                .replace("<commandName>", interaction.commandName)
                .replace(
                  "<subcommandName>",
                  subcommandgroup + " " + subcommand,
                ),
              lang,
            );
            break;
          }
        }
        break;
      case "reset": { // /settings reset
        try {
          await db.resetMods(interaction.guild!.id);
          await db.resetChannels(interaction.guild!.id);
          await db.setUsernameMode(interaction.guild!.id, 4);
          try {
            await db.unsetLanguage(interaction.guild!.id);
          } finally {
            await Util.editReply(
              interaction,
              lang.obj["settings_reset_title_success"],
              lang.obj["settings_reset_description_success"],
              lang,
            );
          }
        } catch (err) {
          await Util.editReply(
            interaction,
            lang.obj["settings_reset_title_failed"],
            `${lang.obj["settings_reset_description_failed"]}${err}`,
            lang,
          );
        }
        break;
      }
      case "help": { // /settings ? help
        let helpTitle = "";
        let helpDescription = "";
        switch (subcommandgroup) {
          case "mods": // /settings mods help
            helpTitle = lang.obj["settings_mods_help"];
            helpDescription =
              `\`/settings mods add <role or user>\` - ${
                lang.obj["settings_mods_add"]
              }\n` +
              `\`/settings mods remove <role or user>\` - ${
                lang.obj["settings_mods_remove"]
              }\n` +
              `\`/settings mods show\` - ${lang.obj["settings_mods_show"]}`;
            break;
          case "channels": // /settings channels help
            helpTitle = lang.obj["settings_channels_help"];
            helpDescription =
              `\`/settings channels add <role or user>\` - ${
                lang.obj["settings_channels_add"]
              }\n` +
              `\`/settings channels remove <role or user>\` - ${
                lang.obj["settings_channels_remove"]
              }\n` +
              `\`/settings channels show\` - ${
                lang.obj["settings_channels_show"]
              }`;
            break;
          case "language": // /settings language help
            helpTitle = lang.obj["settings_language_help"];
            helpDescription =
              `\`/settings language set <language code>\` - ${
                lang.obj["settings_language_set"]
              }\n` +
              `\`/settings language unset\` - ${
                lang.obj["settings_language_unset"]
              }\n` +
              `\`/settings language show\` - ${
                lang.obj["settings_language_show"]
              }`;
            break;
          case "username": // /settings username help
            helpTitle = lang.obj["settings_username_help"];
            helpDescription =
              `\`/settings username set <mode>\` - ${
                lang.obj["settings_username_set"]
              }\n` +
              `\`/settings username unset\` - ${
                lang.obj["settings_username_unset"]
              }\n` +
              `\`/settings username show\` - ${
                lang.obj["settings_username_show"]
              }`;
            break;
          default:
            helpTitle = lang.obj["settings_help"];
            helpDescription =
              `\`/settings mods add <role or user>\` - ${
                lang.obj["settings_mods_add"]
              }\n` +
              `\`/settings mods remove <role or user>\` - ${
                lang.obj["settings_mods_remove"]
              }\n` +
              `\`/settings mods show\` - ${lang.obj["settings_mods_show"]}\n` +
              `\`/settings channels add <role or user>\` - ${
                lang.obj["settings_channels_add"]
              }\n` +
              `\`/settings channels remove <role or user>\` - ${
                lang.obj["settings_channels_remove"]
              }\n` +
              `\`/settings channels show\` - ${
                lang.obj["settings_channels_show"]
              }\n` +
              `\`/settings language set <language code>\` - ${
                lang.obj["settings_language_set"]
              }\n` +
              `\`/settings language unset\` - ${
                lang.obj["settings_language_unset"]
              }\n` +
              `\`/settings language show\` - ${
                lang.obj["settings_language_show"]
              }\n` +
              `\`/settings reset\` - ${lang.obj["settings_reset"]}\n` +
              `\`/settings show\` - ${lang.obj["settings_show"]}\n`;
            break;
        }
        await Util.editReply(interaction, helpTitle, helpDescription, lang);
        break;
      }
      default: {
        await Util.editReply(
          interaction,
          lang.obj["error_invalid_subcommand_title"],
          lang.obj["error_invalid_subcommand_description"]
            .replace("<commandName>", interaction.commandName)
            .replace("<subcommandName>", subcommandgroup + " " + subcommand),
          lang,
        );
        break;
      }
    }
    // returnEmbed(title, message, image=null);
  }

  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName(enLocalizations.settings_name)
      .setNameLocalizations({
        de: deLocalizations.settings_name,
      })
      .setDescription(enLocalizations.settings_description)
      .setDescriptionLocalizations({
        de: deLocalizations.settings_description,
      })
      .addSubcommandGroup((subcommandgroup) =>
        subcommandgroup
          .setName(enLocalizations.settings_mods_name)
          .setNameLocalizations({
            de: deLocalizations.settings_mods_name,
          })
          .setDescription(enLocalizations.settings_mods_description)
          .setDescriptionLocalizations({
            de: deLocalizations.settings_mods_description,
          })
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_mods_add_name)
              .setNameLocalizations({
                de: deLocalizations.settings_mods_add_name,
              })
              .setDescription(enLocalizations.settings_mods_add_description)
              .setDescriptionLocalizations({
                de: deLocalizations.settings_mods_add_description,
              })
              .addMentionableOption((option) =>
                option
                  .setName(enLocalizations.settings_mods_add_mentionable_name)
                  .setNameLocalizations({
                    de: deLocalizations.settings_mods_add_mentionable_name,
                  })
                  .setDescription(
                    enLocalizations.settings_mods_add_mentionable_description,
                  )
                  .setDescriptionLocalizations({
                    de:
                      deLocalizations.settings_mods_add_mentionable_description,
                  })
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_mods_remove_name)
              .setNameLocalizations({
                de: deLocalizations.settings_mods_remove_name,
              })
              .setDescription(enLocalizations.settings_mods_remove_description)
              .setDescriptionLocalizations({
                de: deLocalizations.settings_mods_remove_description,
              })
              .addMentionableOption((option) =>
                option
                  .setName(
                    enLocalizations.settings_mods_remove_mentionable_name,
                  )
                  .setNameLocalizations({
                    de: deLocalizations.settings_mods_remove_mentionable_name,
                  })
                  .setDescription(
                    enLocalizations
                      .settings_mods_remove_mentionable_description,
                  )
                  .setDescriptionLocalizations({
                    de: deLocalizations
                      .settings_mods_remove_mentionable_description,
                  })
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_mods_show_name)
              .setNameLocalizations({
                de: deLocalizations.settings_mods_show_name,
              })
              .setDescription(enLocalizations.settings_mods_show_description)
              .setDescriptionLocalizations({
                de: deLocalizations.settings_mods_show_description,
              })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_mods_help_name)
              .setNameLocalizations({
                de: deLocalizations.settings_mods_help_name,
              })
              .setDescription(enLocalizations.settings_mods_help_description)
              .setDescriptionLocalizations({
                de: deLocalizations.settings_mods_help_description,
              })
          )
      )
      .addSubcommandGroup((subcommandgroup) =>
        subcommandgroup
          .setName(enLocalizations.settings_channels_name)
          .setNameLocalizations({
            de: deLocalizations.settings_channels_name,
          })
          .setDescription(enLocalizations.settings_channels_description)
          .setDescriptionLocalizations({
            de: deLocalizations.settings_channels_description,
          })
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_channels_add_name)
              .setNameLocalizations({
                de: deLocalizations.settings_channels_add_name,
              })
              .setDescription(enLocalizations.settings_channels_add_description)
              .setDescriptionLocalizations({
                de: deLocalizations.settings_channels_add_description,
              })
              .addChannelOption((option) =>
                option
                  .setName(enLocalizations.settings_channels_add_channel_name)
                  .setNameLocalizations({
                    de: deLocalizations.settings_channels_add_channel_name,
                  })
                  .setDescription(
                    enLocalizations.settings_channels_add_channel_description,
                  )
                  .setDescriptionLocalizations({
                    de:
                      deLocalizations.settings_channels_add_channel_description,
                  })
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_channels_remove_name)
              .setNameLocalizations({
                de: deLocalizations.settings_channels_remove_name,
              })
              .setDescription(
                enLocalizations.settings_channels_remove_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_channels_remove_description,
              })
              .addChannelOption((option) =>
                option
                  .setName(
                    enLocalizations.settings_channels_remove_channel_name,
                  )
                  .setNameLocalizations({
                    de: deLocalizations.settings_channels_remove_channel_name,
                  })
                  .setDescription(
                    enLocalizations
                      .settings_channels_remove_channel_description,
                  )
                  .setDescriptionLocalizations({
                    de: deLocalizations
                      .settings_channels_remove_channel_description,
                  })
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_channels_show_name)
              .setNameLocalizations({
                de: deLocalizations.settings_channels_show_name,
              })
              .setDescription(
                enLocalizations.settings_channels_show_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_channels_show_description,
              })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_channels_help_name)
              .setNameLocalizations({
                de: deLocalizations.settings_channels_help_name,
              })
              .setDescription(
                enLocalizations.settings_channels_help_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_channels_help_description,
              })
          )
      )
      .addSubcommandGroup((subcommandgroup) =>
        subcommandgroup
          .setName(enLocalizations.settings_language_name)
          .setNameLocalizations({
            de: deLocalizations.settings_language_name,
          })
          .setDescription(enLocalizations.settings_language_description)
          .setDescriptionLocalizations({
            de: deLocalizations.settings_language_description,
          })
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_language_set_name)
              .setNameLocalizations({
                de: deLocalizations.settings_language_set_name,
              })
              .setDescription(enLocalizations.settings_language_set_description)
              .setDescriptionLocalizations({
                de: deLocalizations.settings_language_set_description,
              })
              .addStringOption((option) =>
                option
                  .setName(enLocalizations.settings_language_set_language_name)
                  .setNameLocalizations({
                    de: deLocalizations.settings_language_set_language_name,
                  })
                  .setDescription(
                    enLocalizations.settings_language_set_language_description,
                  )
                  .setDescriptionLocalizations({
                    de: deLocalizations
                      .settings_language_set_language_description,
                  })
                  .setRequired(true)
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_language_unset_name)
              .setNameLocalizations({
                de: deLocalizations.settings_language_unset_name,
              })
              .setDescription(
                enLocalizations.settings_language_unset_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_language_unset_description,
              })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_language_show_name)
              .setNameLocalizations({
                de: deLocalizations.settings_language_show_name,
              })
              .setDescription(
                enLocalizations.settings_language_show_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_language_show_description,
              })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_language_help_name)
              .setNameLocalizations({
                de: deLocalizations.settings_language_help_name,
              })
              .setDescription(
                enLocalizations.settings_language_help_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_language_help_description,
              })
          )
      )
      .addSubcommandGroup((subcommandgroup) =>
        subcommandgroup
          .setName(enLocalizations.settings_username_name)
          .setNameLocalizations({
            de: deLocalizations.settings_username_name,
          })
          .setDescription(enLocalizations.settings_username_description)
          .setDescriptionLocalizations({
            de: deLocalizations.settings_username_description,
          })
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_username_set_name)
              .setNameLocalizations({
                de: deLocalizations.settings_username_set_name,
              })
              .setDescription(enLocalizations.settings_username_set_description)
              .setDescriptionLocalizations({
                de: deLocalizations.settings_username_set_description,
              })
              .addIntegerOption((option) =>
                option
                  .setName(enLocalizations.settings_username_set_mode_name)
                  .setNameLocalizations({
                    de: deLocalizations.settings_username_set_mode_name,
                  })
                  .setDescription(
                    enLocalizations.settings_username_set_mode_description,
                  )
                  .setDescriptionLocalizations({
                    de: deLocalizations.settings_username_set_mode_description,
                  })
                  .setRequired(true)
                  .addChoices(
                    {
                      name: Util.translateUsernameModeId(0, enLocalizations),
                      name_localizations: {
                        de: Util.translateUsernameModeId(0, deLocalizations),
                      },
                      value: 0,
                    },
                    {
                      name: Util.translateUsernameModeId(1, enLocalizations),
                      name_localizations: {
                        de: Util.translateUsernameModeId(1, deLocalizations),
                      },
                      value: 1,
                    },
                    {
                      name: Util.translateUsernameModeId(2, enLocalizations),
                      name_localizations: {
                        de: Util.translateUsernameModeId(2, deLocalizations),
                      },
                      value: 2,
                    },
                    {
                      name: Util.translateUsernameModeId(3, enLocalizations),
                      name_localizations: {
                        de: Util.translateUsernameModeId(3, deLocalizations),
                      },
                      value: 3,
                    },
                    {
                      name: Util.translateUsernameModeId(4, enLocalizations),
                      name_localizations: {
                        de: Util.translateUsernameModeId(4, deLocalizations),
                      },
                      value: 4,
                    },
                  )
              )
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_username_unset_name)
              .setNameLocalizations({
                de: deLocalizations.settings_username_unset_name,
              })
              .setDescription(
                enLocalizations.settings_username_unset_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_username_unset_description,
              })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_username_show_name)
              .setNameLocalizations({
                de: deLocalizations.settings_username_show_name,
              })
              .setDescription(
                enLocalizations.settings_username_show_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_username_show_description,
              })
          )
          .addSubcommand((subcommand) =>
            subcommand
              .setName(enLocalizations.settings_username_help_name)
              .setNameLocalizations({
                de: deLocalizations.settings_username_help_name,
              })
              .setDescription(
                enLocalizations.settings_username_help_description,
              )
              .setDescriptionLocalizations({
                de: deLocalizations.settings_username_help_description,
              })
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(enLocalizations.settings_reset_name)
          .setNameLocalizations({
            de: deLocalizations.settings_reset_name,
          })
          .setDescription(enLocalizations.settings_reset_description)
          .setDescriptionLocalizations({
            de: deLocalizations.settings_reset_description,
          })
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(enLocalizations.settings_help_name)
          .setNameLocalizations({
            de: deLocalizations.settings_help_name,
          })
          .setDescription(enLocalizations.settings_help_description)
          .setDescriptionLocalizations({
            de: deLocalizations.settings_help_description,
          })
      );
  }
}
