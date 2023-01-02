import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import Language from './language';
import Util from './util';
import Delay from "./delay";
import Timeout from "./timeout";
import Championship from "./championship";
import Database from "./data/postgres";

export default class Mod {

    static async mod(interaction: ChatInputCommandInteraction, db: Database) {
        if (!interaction.guild?.available) {
            await interaction.reply({
                content: 'Guild not available  (score -> score -> interaction.guild.available is either null or false)',
                ephemeral: true
            });
            return;
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'Internal Server Error (score -> score -> interaction.guildId = null)',
                ephemeral: true
            });
            return;
        }
        await interaction.deferReply({ ephemeral: true }); // PokeBot is thinking
        const lang = await Language.getLanguage(interaction.guildId, db);
        let isMod = false;
        if (await db.isMod(interaction.member as GuildMember | null)) {
            isMod = true;
        } else {
            if (interaction.member) {
                let member = interaction.member as GuildMember;
                for (let [/*roleId*/, role] of member.roles.cache) {
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
                case 'score': // /mod score ?
                    switch (subcommand) {
                        case 'add':
                            try {
                                let score = interaction.options.getInteger('score', false);
                                let user = interaction.options.getUser('user');
                                if (score && user) {
                                    await db.addScore(interaction.guildId, user.id, score);
                                } else {
                                    if (user) {
                                        let dbScore = await db.getScore(interaction.guildId, user.id);
                                        if (!dbScore)
                                            await db.setScore(interaction.guildId, user.id, 0);
                                    }
                                }
                                Util.editReply(interaction, lang.obj['mod_score_add_title_success'], lang.obj['mod_score_add_description_success'], lang);
                            } catch (err) {
                                Util.editReply(interaction, lang.obj['mod_score_add_title_failed'], `${lang.obj['mod_score_add_description_failed']}${err}`, lang);
                            }
                            break;
                        case 'remove':
                            try {
                                let score = interaction.options.getInteger('score', false);
                                let user = interaction.options.getUser('user');
                                if (user) {
                                    if (score) {
                                        await db.removeScore(interaction.guildId, user.id, score);
                                    } else {
                                        await db.unsetScore(interaction.guildId, user.id);
                                    }
                                    Util.editReply(interaction, lang.obj['mod_score_remove_title_success'], lang.obj['mod_score_remove_description_success'], lang);
                                }
                            } catch (err) {
                                Util.editReply(interaction, lang.obj['mod_score_remove_title_failed'], `${lang.obj['mod_score_remove_description_failed']}${err}`, lang);
                            }
                            break;
                        case 'set':
                            try {
                                let score = interaction.options.getInteger('score', false);
                                let user = interaction.options.getUser('user');
                                if (user) {
                                    if (score) {
                                        await db.setScore(interaction.guildId, user.id, score);
                                    } else {
                                        let dbScore = await db.getScore(interaction.guildId, user.id);
                                        if (!dbScore)
                                            await db.setScore(interaction.guildId, user.id, 0);
                                    }
                                    Util.editReply(interaction, lang.obj['mod_score_set_title_success'], lang.obj['mod_score_set_description_success'], lang);
                                }
                            } catch (err) {
                                Util.editReply(interaction, lang.obj['mod_score_set_title_failed'], `${lang.obj['mod_score_set_description_failed']}${err}`, lang);
                            }
                            break;
                        default:
                            await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommand), lang);
                    }
                    break;
                case 'delay': // /mod delay ?
                    await Delay.delay(interaction, db);
                    break;
                case 'timeout': // /mod timeout ?
                    await Timeout.timeout(interaction, db);
                    break;
                case 'championship': // /mod championship ?
                    await Championship.championship(interaction, db);
                    break;
                default:
                    await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommandgroup + '' + subcommand), lang);
            }
        } else {
            Util.editReply(interaction, lang.obj['mod_no_mod_title'], lang.obj['mod_no_mod_description'], lang);
        }
        // returnEmbed(title, message, image=null)
    }

    static getRegisterObject() {
        return {
            name: 'mod',
            description: 'Manage delay, timeout and score',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'score',
                    description: 'Manage the score of someone',
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    options: [
                        {
                            name: 'add',
                            description: 'Add a score to a user',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'user',
                                    description: 'The user whose score you want to update',
                                    required: true,
                                    type: ApplicationCommandOptionType.User
                                },
                                {
                                    name: 'score',
                                    description: 'The amount of points you want to add to the score',
                                    required: false,
                                    type: ApplicationCommandOptionType.Integer
                                }
                            ]
                        },
                        {
                            name: 'remove',
                            description: 'Remove a score from a user',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'user',
                                    description: 'The user whose score you want to update',
                                    required: true,
                                    type: ApplicationCommandOptionType.User
                                },
                                {
                                    name: 'score',
                                    description: 'The amount of points you want to remove from the score',
                                    required: false,
                                    type: ApplicationCommandOptionType.Integer
                                }
                            ]
                        },
                        {
                            name: 'set',
                            description: 'Set the score of a user',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'user',
                                    description: 'The user whose score you want to update',
                                    required: true,
                                    type: ApplicationCommandOptionType.User
                                },
                                {
                                    name: 'score',
                                    description: 'The amount of points you want to set the score',
                                    required: false,
                                    type: ApplicationCommandOptionType.Integer
                                }
                            ]
                        }
                    ]
                },
                Delay.getRegisterObject(), Timeout.getRegisterObject(), Championship.getRegisterObject()
            ]
        }
    }
}
