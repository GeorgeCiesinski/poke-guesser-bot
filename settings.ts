import { ChatInputCommandInteraction, PermissionsBitField, Role, GuildMember, GuildChannel, SlashCommandBuilder } from "discord.js";
import Database from "./data/postgres";
import Language from './language';
import Util from './util';
import * as fs from 'fs';

export default class Settings {

    static async settings(interaction: ChatInputCommandInteraction, db: Database): Promise<void> {
        if (!interaction.guild?.available) {
            await interaction.reply({
                content: 'Guild not available  (settings -> settings -> interaction.guild.available is either null or false)',
                ephemeral: true
            });
            return;
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'Internal Server Error (settings -> settings -> interaction.guildId = null)',
                ephemeral: true
            });
            return;
        }
        const lang = await Language.getLanguage(interaction.guildId, db);
        await interaction.deferReply({ ephemeral: true }); // PokeBot is thinking
        // https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
        console.log(`Owner:${interaction.guild.ownerId == interaction.user.id}; Administrator:${interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator, false)}`);
        if (interaction.guild.ownerId != interaction.user.id/*Is Owner*/ && !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator, false)) {
            await Util.editReply(interaction, lang.obj['settings_command_forbidden_error_title'], lang.obj['settings_command_forbidden_error_description'], lang);
            return;
        }
        let subcommandgroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'add':
                switch (subcommandgroup) {
                    case 'mods': // /settings mods add
                        try {
                            let mentionable = interaction.options.getMentionable('mentionable');
                            if (mentionable) {
                                await db.addMod(mentionable as GuildMember | Role);
                                await Util.editReply(interaction, lang.obj['settings_mods_add_title_success'], lang.obj['settings_mods_add_description_success'], lang);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_mods_add_title_failed'], `${lang.obj['settings_mods_add_description_failed']}${err}`, lang);
                        }
                        break;
                    case 'channels': // /settings channels add
                        try {
                            let channel = interaction.options.getChannel('channel');
                            if (channel) {
                                await db.addChannel(channel as GuildChannel);
                                await Util.editReply(interaction, lang.obj['settings_channels_add_title_success'], lang.obj['settings_channels_add_description_success'], lang);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_channels_add_title_failed'], `${lang.obj['settings_channels_add_description_failed']}${err}`, lang);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommandgroup + ' ' + subcommand), lang);
                }
                break;
            case 'remove':
                switch (subcommandgroup) {
                    case 'mods': // /settings mods remove
                        try {
                            let mentionable = interaction.options.getMentionable('mentionable');
                            if (mentionable) {
                                await db.removeMod(mentionable as GuildMember | Role);
                                await Util.editReply(interaction, lang.obj['settings_mods_remove_title_success'], lang.obj['settings_mods_remove_description_success'], lang);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_mods_remove_title_failed'], `${lang.obj['settings_mods_remove_description_failed']}${err}`, lang);
                        }
                        break;
                    case 'channels': // /settings channels remove
                        try {
                            let channel = interaction.options.getChannel('channel');
                            if (channel) {
                                await db.removeChannel(channel as GuildChannel);
                                await Util.editReply(interaction, lang.obj['settings_channels_remove_title_success'], lang.obj['settings_channels_remove_description_success'], lang);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_channels_remove_title_failed'], `${lang.obj['settings_channels_remove_description_failed']}${err}`, lang);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommandgroup + ' ' + subcommand), lang);
                }
                break;
            case 'show':
                let title = '';
                let description = '';
                switch (subcommandgroup) {
                    case 'mods': // /settings mods show
                        title = lang.obj['settings_mods_show_title'];
                        const mods = await db.listMods(interaction.guildId);
                        for (let i = 0; i < mods.length; i++) {
                            description += `<@${mods[i].getDataValue('isUser') ? mods[i].getDataValue('mentionableId') : '&' + mods[i].get('mentionableId')}> (${mods[i].get('mentionableId')})\n`;
                        }
                        if (description.length < 20)
                            description = lang.obj['settings_mods_show_none'];
                        break;
                    case 'channels': // /settings channels show
                        title = lang.obj['settings_channels_show_title'];
                        const channels = await db.listChannels(interaction.guildId);
                        for (let i = 0; i < channels.length; i++) {
                            description += `<#${channels[i].get('channelId')}> (${channels[i].get('channelId')})\n`;
                        }
                        if (description.length < 20)
                            description = lang.obj['settings_channels_show_none'];
                        break;
                    case 'language': // /settings language show
                        title = lang.obj['settings_language_show_title'];
                        description = await db.getLanguageCode(interaction.guildId);
                        break;
                    default:
                        title = lang.obj['error_invalid_subcommand_title'];
                        description = lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommandgroup + ' ' + subcommand);
                        break;
                }
                await Util.editReply(interaction, title, description, lang);
                break;
            case 'set':
                switch (subcommandgroup) {
                    case 'language': // /settings language set
                        try {
                            let language = interaction.options.getString('language');
                            
                            if (language) {
                                if (fs.existsSync(`./languages/${language}.json`)) {
                                    await db.setLanguage(interaction.guildId, language);
                                    await Util.editReply(interaction, lang.obj['settings_language_set_title_success'], lang.obj['settings_language_set_description_success'], lang);
                                } else {
                                    await Util.editReply(interaction, lang.obj['settings_language_set_title_unavailable'], lang.obj['settings_language_set_description_unavailable'], lang);
                                }
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_language_set_title_failed'], `${lang.obj['settings_language_set_description_failed']}${err}`, lang);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommandgroup + ' ' + subcommand), lang);
                        break;
                }
                break;
            case 'unset':
                switch (subcommandgroup) {
                    case 'language': // /settings language unset
                        try {
                            await db.unsetLanguage(interaction.guildId);
                            await Util.editReply(interaction, lang.obj['settings_language_unset_title_success'], lang.obj['settings_language_unset_description_success'], lang);
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_language_unset_title_failed'], lang.obj['settings_language_unset_description_failed'], lang);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommandgroup + ' ' + subcommand), lang);
                        break;
                }
                break;
            case 'reset': // /settings reset
                try {
                    await db.resetMods(interaction.guildId);
                    await db.resetChannels(interaction.guildId);
                    try {
                        await db.unsetLanguage(interaction.guildId);
                    } catch (e) {}
                    await Util.editReply(interaction, lang.obj['settings_reset_title_success'], lang.obj['settings_reset_description_success'], lang);
                } catch (err) {
                    await Util.editReply(interaction, lang.obj['settings_reset_title_failed'], `${lang.obj['settings_reset_description_failed']}${err}`, lang);
                }
                break;
            case 'help': // /settings ? help
                let helpTitle = '';
                let helpDescription = '';
                switch (subcommandgroup) {
                    case 'mods': // /settings mods help
                        helpTitle = lang.obj['settings_mods_help'];
                        helpDescription = `\`/settings mods add <role or user>\` - ${lang.obj['settings_mods_add']}\n` +
                                        `\`/settings mods remove <role or user>\` - ${lang.obj['settings_mods_remove']}\n` +
                                        `\`/settings mods show\` - ${lang.obj['settings_mods_show']}`;
                        break;
                    case 'channels': // /settings channels help
                        helpTitle = lang.obj['settings_channels_help'];
                        helpDescription = `\`/settings channels add <role or user>\` - ${lang.obj['settings_channels_add']}\n` +
                                        `\`/settings channels remove <role or user>\` - ${lang.obj['settings_channels_remove']}\n` +
                                        `\`/settings channels show\` - ${lang.obj['settings_channels_show']}`;
                        break;
                    case 'language': // /settings language help
                        helpTitle = lang.obj['settings_language_help'];
                        helpDescription = `\`/settings language set <language code>\` - ${lang.obj['settings_language_set']}\n` +
                                        `\`/settings language unset\` - ${lang.obj['settings_language_unset']}\n` +
                                        `\`/settings channels show\` - ${lang.obj['settings_language_show']}`;
                        break;
                    default:
                        helpTitle = lang.obj['settings_help'];
                        helpDescription = `\`/settings mods add <role or user>\` - ${lang.obj['settings_mods_add']}\n` +
                                        `\`/settings mods remove <role or user>\` - ${lang.obj['settings_mods_remove']}\n` +
                                        `\`/settings mods show\` - ${lang.obj['settings_mods_show']}\n` +
                                        `\`/settings channels add <role or user>\` - ${lang.obj['settings_channels_add']}\n` +
                                        `\`/settings channels remove <role or user>\` - ${lang.obj['settings_channels_remove']}\n` +
                                        `\`/settings channels show\` - ${lang.obj['settings_channels_show']}\n` +
                                        `\`/settings language set <language code>\` - ${lang.obj['settings_language_set']}\n` +
                                        `\`/settings language unset\` - ${lang.obj['settings_language_unset']}\n` +
                                        `\`/settings language show\` - ${lang.obj['settings_language_show']}\n` +
                                        `\`/settings reset\` - ${lang.obj['settings_reset']}\n` +
                                        `\`/settings show\` - ${lang.obj['settings_show']}\n`;
                        break;
                }
                await Util.editReply(interaction, helpTitle, helpDescription, lang);
                break;
            default:
                await Util.editReply(interaction, lang.obj['error_invalid_subcommand_title'], lang.obj['error_invalid_subcommand_description'].replace('<commandName>', interaction.commandName).replace('<subcommandName>', subcommandgroup + ' ' + subcommand), lang);
                break;
        }
        // returnEmbed(title, message, image=null);
    }

    static getRegisterObject() {
        return new SlashCommandBuilder()
        .setName('settings')
        .setNameLocalizations({
            'de': 'einstellungen'
        })
        .setDescription('View or manage settings in ephemeral messages')
        .setDescriptionLocalizations({
            'de': 'Einstellungen in kurzlebigen Nachrichten anzeigen oder verwalten'
        })
        .addSubcommandGroup(subcommandgroup =>
            subcommandgroup
            .setName('mods')
            .setNameLocalizations({
                'de': 'mods'
            })
            .setDescription('View or manage bot mods')
            .setDescriptionLocalizations({
                'de': 'Bot Mods anzeigen oder verwalten'
            })
            .addSubcommand(subcommand =>
                subcommand
                .setName('add')
                .setNameLocalizations({
                    'de': 'hinzufuegen'
                })
                .setDescription('Add a bot mod')
                .setDescriptionLocalizations({
                    'de': 'Einen Bot Mod hinzufügen'
                })
                .addMentionableOption(option =>
                    option
                    .setName('mentionable')
                    .setNameLocalizations({
                        'de': 'erwaehnbares'
                    })
                    .setDescription('The user or role to add as a bot mod')
                    .setDescriptionLocalizations({
                        'de': 'Der Benutzer oder die Rolle, die zu einem Bot Mod werden soll'
                    })
                    .setRequired(true)
                )
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('remove')
                .setNameLocalizations({
                    'de': 'entfernen'
                })
                .setDescription('Remove a bot mod')
                .setDescriptionLocalizations({
                    'de': 'Einen Bot Mod entfernen'
                })
                .addMentionableOption(option =>
                    option
                    .setName('mentionable')
                    .setNameLocalizations({
                        'de': 'erwaehnbares'
                    })
                    .setDescription('The user or role to remove from a Bot Mod')
                    .setDescriptionLocalizations({
                        'de': 'Der Benutzer oder die Rolle, die kein Bot Mod mehr sein soll'
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
                .setDescription('Shows the current mods')
                .setDescriptionLocalizations({
                    'de': 'Zeigt die aktuellen bot mods an'
                })
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('help')
                .setNameLocalizations({
                    'de': 'hilfe'
                })
                .setDescription('Shows help for mod settings')
                .setDescriptionLocalizations({
                    'de': 'Zeigt Hilfe zu den Mod Einstellungen an'
                })
            )
        )
        .addSubcommandGroup(subcommandgroup =>
            subcommandgroup
            .setName('channels')
            .setNameLocalizations({
                'de': 'kanaele'
            })
            .setDescription('View or manage bot channels')
            .setDescriptionLocalizations({
                'de': 'Bot Kanäle anzeigen oder verwalten'
            })
            .addSubcommand(subcommand =>
                subcommand
                .setName('add')
                .setNameLocalizations({
                    'de': 'hinzufuegen'
                })
                .setDescription('Add a bot channel')
                .setDescriptionLocalizations({
                    'de': 'Einen Bot Kanal hinzufügen'
                })
                .addChannelOption(option =>
                    option
                    .setName('mentionable')
                    .setNameLocalizations({
                        'de': 'erwaehnbares'
                    })
                    .setDescription('The channel to add as a bot channel')
                    .setDescriptionLocalizations({
                        'de': 'Der Kanal, der zu einem Bot Kanal werden soll'
                    })
                    .setRequired(true)
                )
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('remove')
                .setNameLocalizations({
                    'de': 'entfernen'
                })
                .setDescription('Remove a bot channel')
                .setDescriptionLocalizations({
                    'de': 'Einen Bot Kanal entfernen'
                })
                .addMentionableOption(option =>
                    option
                    .setName('mentionable')
                    .setNameLocalizations({
                        'de': 'erwaehnbares'
                    })
                    .setDescription('The channel to remove from the bot channels')
                    .setDescriptionLocalizations({
                        'de': 'Der Kanal, der kein Bot Kanal mehr sein soll'
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
                .setDescription('Shows the current bot channels')
                .setDescriptionLocalizations({
                    'de': 'Zeigt die aktuellen Bot Kanäle an'
                })
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('help')
                .setNameLocalizations({
                    'de': 'hilfe'
                })
                .setDescription('Shows help for channel settings')
                .setDescriptionLocalizations({
                    'de': 'Zeigt Hilfe zu den Kanal Einstellungen an'
                })
            )
        )
        .addSubcommandGroup(subcommandgroup =>
            subcommandgroup
            .setName('language')
            .setNameLocalizations({
                'de': 'sprache'
            })
            .setDescription('View or manage a preferred language')
            .setDescriptionLocalizations({
                'de': 'Die bevorzugte Sprache ansehen und verwalten'
            })
            .addSubcommand(subcommand =>
                subcommand
                .setName('set')
                .setNameLocalizations({
                    'de': 'setzen'
                })
                .setDescription('Set the preferred language for this server')
                .setDescriptionLocalizations({
                    'de': 'Die bevorzugte Sprache für diesen Server setzen'
                })
                .addStringOption(option =>
                    option
                    .setName('language')
                    .setNameLocalizations({
                        'de': 'sprache'
                    })
                    .setDescription('The language code of your preferred language (e.g. en_US)')
                    .setDescriptionLocalizations({
                        'de': 'Der Sprachcode der bevorzugten Sprache (z. B. en_US)'
                    })
                    .setRequired(true)
                )
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('unset')
                .setNameLocalizations({
                    'de': 'zuruecksetzen'
                })
                .setDescription('Unsets your preferred language for this server')
                .setDescriptionLocalizations({
                    'de': 'Setzt die bevorzugte Sprache für diesen Server zurück'
                })
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('show')
                .setNameLocalizations({
                    'de': 'anzeigen'
                })
                .setDescription('Shows your currently set preferred language for this server')
                .setDescriptionLocalizations({
                    'de': 'Zeigt die aktuell bevorzugte Serversprache an'
                })
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('help')
                .setNameLocalizations({
                    'de': 'hilfe'
                })
                .setDescription('Shows help for language settings')
                .setDescriptionLocalizations({
                    'de': 'Zeigt Hilfe zu den Spracheinstellungen an'
                })
            )
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('reset')
            .setNameLocalizations({
                'de': 'zuruecksetzen'
            })
            .setDescription('Resets all current settings')
            .setDescriptionLocalizations({
                'de': 'Setzt alle aktuellen Einstellungen zurück'
            })
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName('help')
            .setNameLocalizations({
                'de': 'hilfe'
            })
            .setDescription('Shows Help for the /settings command')
            .setDescriptionLocalizations({
                'de': 'Zeigt Hilfe zum /settings-Befehl an'
            })
        );
    }
}
