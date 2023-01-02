import { ChatInputCommandInteraction, SlashCommandSubcommandGroupBuilder } from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from './util';

export default class Timeout {

    static async timeout(interaction: ChatInputCommandInteraction, db: Database): Promise<void> {
        if (!interaction.guild?.available) {
            await interaction.reply({
                content: 'Guild not available  (timeout -> timeout -> interaction.guild.available is either null or false)',
                ephemeral: true
            });
            return;
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'Internal Server Error (timeout -> timeout -> interaction.guildId = null)',
                ephemeral: true
            });
            return;
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
                        await Util.editReply(interaction, lang.obj['mod_timeout_set_title_success'], lang.obj['mod_timeout_set_description_success'], lang);
                    }
                } catch (err) {
                    await Util.editReply(interaction, lang.obj['mod_timeout_set_title_failed'], `${lang.obj['mod_timeout_set_description_failed']}${err}`, lang);
                }
                break;
            case 'unset':
                try {
                    let guildId = interaction.guildId || null;
                    let user = interaction.options.getUser('user') || null;
                    if (guildId != null && user != null) {
                        await Timeout.unsetTimeout(guildId, user.id);
                        await Util.editReply(interaction, lang.obj['mod_timeout_unset_title_success'], lang.obj['mod_timeout_unset_description_success'], lang);
                    }
                } catch (err) {
                    await Util.editReply(interaction, lang.obj['mod_timeout_unset_title_failed'], `${lang.obj['mod_timeout_unset_description_failed']}${err}`, lang);
                }
                break;
            case 'show':
                try {
                    let guildId = interaction.guildId || null;
                    let user = interaction.options.getUser('user') || null;
                    if (guildId != null && user != null) {
                        await Timeout.showTimeout(guildId, user.id);
                        await Util.editReply(interaction, lang.obj['mod_timeout_show_title_success'], lang.obj['mod_timeout_show_description_success'], lang);
                    }
                } catch (err) {
                    await Util.editReply(interaction, lang.obj['mod_timeout_show_title_failed'], `${lang.obj['mod_timeout_show_description_failed']}${err}`, lang);
                }
                break;
            default:
                await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommand), lang);
        }
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

    static getRegisterObject(subcommandgroup: SlashCommandSubcommandGroupBuilder): SlashCommandSubcommandGroupBuilder {
        return subcommandgroup
        .setName('timeout')
        .setNameLocalizations({
            'de': 'auszeit'
        })
        .setDescription('Manage the timeout of a user')
        .setDescriptionLocalizations({
            'de': 'Die Auszeit eines Benutzers verwalten'
        })
        .addSubcommand(subcommand =>
            subcommand
            .setName('set')
            .setNameLocalizations({
                'de': 'setzen'
            })
            .setDescription('Sets a users timeout')
            .setDescriptionLocalizations({
                'de': 'Setzt eine Auszeit eines Benutzers'
            })
            .addUserOption(option =>
                option
                .setName('user')
                .setNameLocalizations({
                    'de': 'benutzer'
                })
                .setDescription('The user whose timeout you want to set')
                .setDescriptionLocalizations({
                    'de': 'Der Benutzer dessen Auszeit gesetzt werden soll'
                })
                .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                .setName('days')
                .setNameLocalizations({
                    'de': 'tage'
                })
                .setDescription('The duration you want to set the timeout to')
                .setDescriptionLocalizations({
                    'de': 'Die Dauer, auf die du die Auszeit setzen willst'
                })
            )
            .addIntegerOption(option =>
                option
                .setName('hours')
                .setNameLocalizations({
                    'de': 'stunden'
                })
                .setDescription('The duration you want to set the timeout to')
                .setDescriptionLocalizations({
                    'de': 'Die Dauer, auf die du die Auszeit setzen willst'
                })
            )
            .addIntegerOption(option =>
                option
                .setName('minutes')
                .setNameLocalizations({
                    'de': 'minuten'
                })
                .setDescription('The duration you want to set the timeout to')
                .setDescriptionLocalizations({
                    'de': 'Die Dauer, auf die du die Auszeit setzen willst'
                })
            )
            .addIntegerOption(option =>
                option
                .setName('seconds')
                .setNameLocalizations({
                    'de': 'sekunden'
                })
                .setDescription('The duration you want to set the timeout to')
                .setDescriptionLocalizations({
                    'de': 'Die Dauer, auf die du die Auszeit setzen willst'
                })
            )
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('unset')
            .setNameLocalizations({
                'de': 'entfernen'
            })
            .setDescription('Unsets a users timeout')
            .setDescriptionLocalizations({
                'de': 'Entfernt die Auszeit eines Benutzers'
            })
            .addUserOption(option =>
                option
                .setName('user')
                .setNameLocalizations({
                    'de': 'benutzer'
                })
                .setDescription('The user whose timeout you want to unset')
                .setDescriptionLocalizations({
                    'de': 'Der Benutzer dessen Auszeit entfernt werden soll'
                })
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('show')
            .setNameLocalizations({
                'de': 'anzeigen'
            })
            .setDescription('Shows a users timeout')
            .setDescriptionLocalizations({
                'de': 'Zeigt die Deuer der Auszeit eines Benutzers an'
            })
            .addUserOption(option =>
                option
                .setName('user')
                .setNameLocalizations({
                    'de': 'benutzer'
                })
                .setDescription('The user whose timeout you want to see')
                .setDescriptionLocalizations({
                    'de': 'Der Benutzer dessen Auszeit du sehen willst'
                })
                .setRequired(true)
            )
        );
    }
}
