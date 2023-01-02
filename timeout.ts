import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from './util';

export default class Timeout {

    static async timeout(interaction: ChatInputCommandInteraction, db: Database): Promise<{title: string, description: string}> {
        if (!interaction.guild?.available) {
            await interaction.reply({
                content: 'Guild not available  (timeout -> timeout -> interaction.guild.available is either null or false)',
                ephemeral: true
            });
            return { title: '', description: '' };
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'Internal Server Error (timeout -> timeout -> interaction.guildId = null)',
                ephemeral: true
            });
            return { title: '', description: '' };
        }
        await interaction.deferReply({ ephemeral: true }); // PokeBot is thinking
        const lang = await Language.getLanguage(interaction.guildId, db);
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'set':
                try {
                    let d = interaction.options.getInteger('days', false) || 0;
                    let h = interaction.options.getInteger('hours', false) || 0;
                    let m = interaction.options.getInteger('minutes', false) || 0;
                    let s = interaction.options.getInteger('seconds', false) || 0;
                    let guildId = interaction.guildId || null;
                    let user = interaction.options.getUser('user') || null;
                    if (guildId != null && user != null) {
                        await Timeout.setTimeout(guildId, user.id, d, h, m, s);
                        return {
                            title: lang.obj['mod_timeout_set_title_success'],
                            description: lang.obj['mod_timeout_set_description_success']
                        };
                    }
                } catch (err) {
                    return {
                        title: lang.obj['mod_timeout_set_title_failed'],
                        description: `${lang.obj['mod_timeout_set_description_failed']}${err}`
                    }
                }
                break;
            case 'unset':
                try {
                    let guildId = interaction.guildId || null;
                    let user = interaction.options.getUser('user') || null;
                    if (guildId != null && user != null) {
                        await Timeout.unsetTimeout(guildId, user.id);
                        return {
                            title: lang.obj['mod_timeout_unset_title_success'],
                            description: lang.obj['mod_timeout_unset_description_success']
                        };
                    }
                } catch (err) {
                    return {
                        title: lang.obj['mod_timeout_unset_title_failed'],
                        description: `${lang.obj['mod_timeout_unset_description_failed']}${err}`
                    };
                }
                break;
            case 'show':
                try {
                    let guildId = interaction.guildId || null;
                    let user = interaction.options.getUser('user') || null;
                    if (guildId != null && user != null) {
                        await Timeout.showTimeout(guildId, user.id);
                        return {
                            title: lang.obj['mod_timeout_show_title_success'],
                            description: lang.obj['mod_timeout_show_description_success']
                        };
                    }
                } catch (err) {
                    return {
                        title: lang.obj['mod_timeout_show_title_failed'],
                        description: `${lang.obj['mod_timeout_show_description_failed']}${err}`
                    };
                }
                break;
            default:
                await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommand), lang);
        }
        // returnEmbed(title, message, image=null)
        return {title: 'Error', description: 'timeout.ts -> Should never happen'};
    }

    private static async setTimeout(serverId: string, userId: string, days: number = 0, hours: number = 0, minutes: number = 0, seconds: number = 0) {
        // TODO: Execute Mod Actions
    }

    private static async unsetTimeout(serverId: string, userId: string) {
        // TODO: Execute Mod Actions
    }

    private static async showTimeout(serverId: string, userId: string) {
        // TODO: Execute Mod Actions
    }

    static getRegisterObject() {
        return {
            name: 'timeout',
            description: 'Manage the timeout of a user',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'set',
                    description: 'Sets a users timeout',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'The user whose timeout you want to set',
                            required: true,
                            type: ApplicationCommandOptionType.User
                        },
                        {
                            name: 'days',
                            description: 'The time you want to set the timeout to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        },
                        {
                            name: 'hours',
                            description: 'The time you want to set the timeout to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        },
                        {
                            name: 'minutes',
                            description: 'The time you want to set the timeout to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        },
                        {
                            name: 'seconds',
                            description: 'The time you want to set the timeout to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        }
                    ]
                },
                {
                    name: 'unset',
                    description: 'Unsets a users timeout',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'The user whose timeout you want to unset',
                            required: true,
                            type: ApplicationCommandOptionType.User
                        }
                    ]
                },
                {
                    name: 'show',
                    description: 'Shows a users timeout',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'The user whose score you want to show',
                            required: true,
                            type: ApplicationCommandOptionType.User
                        }
                    ]
                }
            ]
        }
    }
}
