import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from './util';

export default class Delay {
    
    static async delay(interaction: ChatInputCommandInteraction, db: Database) {
        if (!interaction.guild?.available) {
            await interaction.reply({
                content: 'Guild not available  (delay -> delay -> interaction.guild.available is either null or false)',
                ephemeral: true
            });
            return;
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'Internal Server Error (delay -> delay -> interaction.guildId = null)',
                ephemeral: true
            });
            return;
        }
        await interaction.deferReply({ ephemeral: false }); // PokeBot is thinking
        const lang = await Language.getLanguage(interaction.guildId, db);
        let subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'set':
                try {
                    let d = interaction.options.getInteger('days', false) || 0;
                    let h = interaction.options.getInteger('hours', false) || 0;
                    let m = interaction.options.getInteger('minutes', false) || 0;
                    let s = interaction.options.getInteger('seconds', false) || 0;
                    let user = interaction.options.getUser('user');
                    if (user) {
                        await Delay.setDelay(interaction.guildId, user.id, d, h, m, s);
                        await Util.editReply(interaction, lang.obj['mod_delay_set_title_success'], lang.obj['mod_delay_set_description_success'], lang);
                    }
                } catch (err) {
                    Util.editReply(interaction, lang.obj['mod_delay_set_title_failed'], `${lang.obj['mod_delay_set_description_failed']}${err}`, lang);
                }
                break;
            case 'unset':
                try {
                    let user = interaction.options.getUser('user');
                    if (user) {
                        await Delay.unsetDelay(interaction.guildId, user.id);
                        await Util.editReply(interaction, lang.obj['mod_delay_unset_title_success'], lang.obj['mod_delay_unset_description_success'], lang);
                    }
                } catch (err) {
                    await Util.editReply(interaction, lang.obj['mod_delay_unset_title_failed'], `${lang.obj['mod_delay_unset_description_failed']}${err}`, lang);
                }
                break;
            case 'show':
                try {
                    let user = interaction.options.getUser('user');
                    if (user) {
                        await Delay.showDelay(interaction.guildId, user.id);
                        await Util.editReply(interaction, lang.obj['mod_delay_show_title_success'], lang.obj['mod_delay_show_description_success'], lang);
                    }
                } catch (err) {
                    await Util.editReply(interaction, lang.obj['mod_delay_show_title_failed'], `${lang.obj['mod_delay_show_description_failed']}${err}`, lang);
                }
                break;
            default:
                await Util.editReply(interaction, 'Invalid Subcommand', `You used an invalid /delay subcommand (${subcommand}`, lang);
        }
        // returnEmbed(title, message, image=null)
    }

    private static async setDelay(serverId: string, userId: string, days: number = 0, hours: number = 0, minutes: number = 0, seconds: number = 0) {
        // TODO: Execute Delay Actions
    }

    private static async unsetDelay(serverId: string, userId: string) {
        // TODO: Execute Delay Actions
    }

    private static async showDelay(serverId: string, userId: string) {
        // TODO: Execute Delay Actions
    }

    static getRegisterObject() {
        return {
            name: 'delay',
            description: 'Manage the delay of someone',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'set',
                    description: 'Sets a users delay',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'The user whose delay you want to set',
                            required: true,
                            type: ApplicationCommandOptionType.User
                        },
                        {
                            name: 'days',
                            description: 'The time you want to set the delay to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        },
                        {
                            name: 'hours',
                            description: 'The time you want to set the delay to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        },
                        {
                            name: 'minutes',
                            description: 'The time you want to set the delay to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        },
                        {
                            name: 'seconds',
                            description: 'The time you want to set the delay to',
                            required: false,
                            type: ApplicationCommandOptionType.Integer
                        }
                    ]
                },
                {
                    name: 'unset',
                    description: 'Unsets a users delay',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'The user whose delay you want to unset',
                            required: true,
                            type: ApplicationCommandOptionType.User
                        }
                    ]
                },
                {
                    name: 'show',
                    description: 'Shows a users delay',
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
        };
    }
}
