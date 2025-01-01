import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import Language from "./language.ts";
import Util from "./util.ts";
import Delay from "./delay.ts";
import Timeout from "./timeout.ts";
import Championship from "./championship.ts";
import Database from "./data/postgres.ts";
import enLocalizations from "./languages/slash-commands/en.json" with {
  type: "json",
};
import deLocalizations from "./languages/slash-commands/de.json" with {
  type: "json",
};

export default class Mod {
  static async mod(interaction: ChatInputCommandInteraction, db: Database) {
    await interaction.deferReply({ ephemeral: true }); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    let isMod = false;
    if (await db.isMod(interaction.member as GuildMember | null)) {
      isMod = true;
    } else {
      if (interaction.member) {
        const member = interaction.member as GuildMember;
        for (const [, role] of member.roles.cache) {
          if (await db.isMod(role)) {
            isMod = true;
            break;
          }
        }
      }
    }
    if (isMod) {
      const subcommandgroup = interaction.options.getSubcommandGroup();
      const subcommand = interaction.options.getSubcommand();
      switch (subcommandgroup) {
        case "score": // /mod score ?
          // See default case
          break;
        case "delay": // /mod delay ?
          await Delay.delay(interaction, db);
          break;
        case "timeout": // /mod timeout ?
          await Timeout.timeout(interaction, db);
          break;
        case "championship": // /mod championship ?
          await Championship.championship(interaction, db);
          break;
        default:
          switch (subcommand) {
            case "score": {
              const user = interaction.options.getUser("user", false) ||
                interaction.user;
              const action = interaction.options.getString("action", false);
              const amount = interaction.options.getInteger("amount", false);
              switch (action) {
                case "add": {
                  try {
                    const dbScore = await db.getScore(
                      interaction.guild!.id,
                      user.id,
                    );
                    if (amount) {
                      if (dbScore) {
                        await db.setScore(
                          interaction.guild!.id,
                          user.id,
                          dbScore.score + amount,
                        );
                      } else {
                        await db.setScore(
                          interaction.guild!.id,
                          user.id,
                          amount,
                        );
                      }
                    } else {
                      if (dbScore) {
                        await db.setScore(
                          interaction.guild!.id,
                          user.id,
                          dbScore.score + 1,
                        );
                      } else {
                        await db.setScore(interaction.guild!.id, user.id, 0);
                      }
                    }
                    await Util.editReply(
                      interaction,
                      lang.obj["mod_score_add_title_success"],
                      lang.obj["mod_score_add_description_success"],
                      lang,
                    );
                  } catch (err) {
                    await Util.editReply(
                      interaction,
                      lang.obj["mod_score_add_title_failed"],
                      `${lang.obj["mod_score_add_description_failed"]}${err}`,
                      lang,
                    );
                  }
                  break;
                }
                case "remove": {
                  try {
                    if (amount) {
                      await db.removeScore(
                        interaction.guild!.id,
                        user.id,
                        amount,
                      );
                    } else {
                      await db.unsetScore(interaction.guild!.id, user.id);
                    }
                    await Util.editReply(
                      interaction,
                      lang.obj["mod_score_remove_title_success"],
                      lang.obj["mod_score_remove_description_success"],
                      lang,
                    );
                  } catch (err) {
                    await Util.editReply(
                      interaction,
                      lang.obj["mod_score_remove_title_failed"],
                      `${
                        lang.obj["mod_score_remove_description_failed"]
                      }${err}`,
                      lang,
                    );
                  }
                  break;
                }
                case "set": {
                  try {
                    if (amount && amount >= 0) {
                      await db.setScore(interaction.guild!.id, user.id, amount);
                    } else {
                      const dbScore = await db.getScore(
                        interaction.guild!.id,
                        user.id,
                      );
                      if (!dbScore) {
                        await db.setScore(interaction.guild!.id, user.id, 0);
                      }
                    }
                    await Util.editReply(
                      interaction,
                      lang.obj["mod_score_set_title_success"],
                      lang.obj["mod_score_set_description_success"],
                      lang,
                    );
                  } catch (err) {
                    await Util.editReply(
                      interaction,
                      lang.obj["mod_score_set_title_failed"],
                      `${lang.obj["mod_score_set_description_failed"]}${err}`,
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
                      .replace("<subcommandName>", action!),
                    lang,
                  );
                }
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
              break;
          }
          break;
      }
    } else {
      await Util.editReply(
        interaction,
        lang.obj["mod_no_mod_title"],
        lang.obj["mod_no_mod_description"],
        lang,
      );
    }
  }

  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName(enLocalizations.mod_name)
      .setNameLocalizations({
        de: deLocalizations.mod_name,
      })
      .setDescription(enLocalizations.mod_description)
      .setDescriptionLocalizations({
        de: deLocalizations.mod_description,
      })
      .addSubcommand((subcommand) =>
        subcommand
          .setName(enLocalizations.mod_score_name)
          .setNameLocalizations({
            de: deLocalizations.mod_score_name,
          })
          .setDescription(enLocalizations.mod_score_description)
          .setDescriptionLocalizations({
            de: deLocalizations.mod_score_description,
          })
          .addUserOption((option) =>
            option
              .setName(enLocalizations.mod_score_user_name)
              .setNameLocalizations({ de: deLocalizations.mod_score_user_name })
              .setDescription(enLocalizations.mod_score_user_description)
              .setDescriptionLocalizations({
                de: deLocalizations.mod_score_user_description,
              })
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName(enLocalizations.mod_score_action_name)
              .setNameLocalizations({
                de: deLocalizations.mod_score_action_name,
              })
              .setDescription(enLocalizations.mod_score_action_description)
              .setDescriptionLocalizations({
                de: deLocalizations.mod_score_action_description,
              })
              .setChoices(
                {
                  name: enLocalizations.mod_score_action_choice_add,
                  name_localizations: {
                    de: deLocalizations.mod_score_action_choice_add,
                  },
                  value: "add",
                },
                {
                  name: enLocalizations.mod_score_action_choice_remove,
                  name_localizations: {
                    de: deLocalizations.mod_score_action_choice_remove,
                  },
                  value: "remove",
                },
                {
                  name: enLocalizations.mod_score_action_choice_set,
                  name_localizations: {
                    de: deLocalizations.mod_score_action_choice_set,
                  },
                  value: "set",
                },
              )
              .setRequired(true)
          )
          .addIntegerOption((option) =>
            option
              .setName(enLocalizations.mod_score_amount_name)
              .setNameLocalizations({
                de: deLocalizations.mod_score_amount_name,
              })
              .setDescription(enLocalizations.mod_score_amount_description)
              .setDescriptionLocalizations({
                de: deLocalizations.mod_score_amount_description,
              })
              .setRequired(true)
          )
      )
      .addSubcommandGroup((subcommandgroup) =>
        Delay.getRegisterObject(subcommandgroup)
      )
      .addSubcommandGroup((subcommandgroup) =>
        Timeout.getRegisterObject(subcommandgroup)
      )
      .addSubcommandGroup((subcommandgroup) =>
        Championship.getRegisterObject(subcommandgroup)
      );
  }
}
