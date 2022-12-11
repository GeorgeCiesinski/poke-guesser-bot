import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder, Role, GuildMember, GuildChannel, } from "discord.js";
import Database from "./data/postgres";
import Language from './language';
import Util from './util';

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
            await Util.editReply(interaction, lang.obj['settings_command_forbidden_error_title'], lang.obj['settings_command_forbidden_error_description']);
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
                                await Util.editReply(interaction, lang.obj['settings_mods_add_title_success'], lang.obj['settings_mods_add_description_success']);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_mods_add_title_failed'], `${lang.obj['settings_mods_add_description_failed']}${err}`);
                        }
                        break;
                    case 'channels': // /settings channels add
                        try {
                            let channel = interaction.options.getChannel('channel');
                            if (channel) {
                                await db.addChannel(channel as GuildChannel);
                                await Util.editReply(interaction, lang.obj['settings_channels_add_title_success'], lang.obj['settings_channels_add_description_success']);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_channels_add_title_failed'], lang.obj['settings_channels_add_description_failed']);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, 'Invalid Subcommand Group', `You used an invalid /settings subcommand group (${subcommandgroup}`);
                }
                break;
            case 'remove':
                switch (subcommandgroup) {
                    case 'mods': // /settings mods remove
                        try {
                            let mentionable = interaction.options.getMentionable('mentionable');
                            if (mentionable) {
                                await db.removeMod(mentionable as GuildMember | Role);
                                await Util.editReply(interaction, lang.obj['settings_mods_remove_title_success'], lang.obj['settings_mods_remove_description_success']);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_mods_remove_title_failed'], `${lang.obj['settings_mods_remove_description_failed']}${err}`);
                        }
                        break;
                    case 'channels': // /settings channels remove
                        try {
                            let channel = interaction.options.getChannel('channel');
                            if (channel) {
                                await db.removeChannel(channel as GuildChannel);
                                await Util.editReply(interaction, lang.obj['settings_channels_remove_title_success'], lang.obj['settings_channels_remove_description_success']);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_channels_remove_title_failed'], `${lang.obj['settings_channels_remove_description_failed']}${err}`);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, 'Invalid Subcommand Group', `You used an invalid /settings subcommand group (${subcommandgroup}`);
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
                        title = 'Invalid Subcommand Group';
                        description = `You used an invalid /settings subcommand group (${subcommandgroup}`;
                        break;
                }
                await Util.editReply(interaction, title, description);
                break;
            case 'set':
                switch (subcommandgroup) {
                    case 'language': // /settings language set
                        try {
                            let language = interaction.options.getString('language');
                            if (language) {
                                await db.setLanguage(interaction.guildId, language);
                                await Util.editReply(interaction, lang.obj['settings_language_set_title_success'], lang.obj['settings_language_set_description_success']);
                            }
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_language_set_title_failed'], `${lang.obj['settings_language_set_description_failed']}${err}`);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, 'Invalid Subcommand Group', `You used an invalid /settings subcommand group (${subcommandgroup}`);
                        break;
                }
                break;
            case 'unset':
                switch (subcommandgroup) {
                    case 'language': // /settings language unset
                        try {
                            await db.unsetLanguage(interaction.guildId);
                            await Util.editReply(interaction, lang.obj['settings_language_unset_title_success'], lang.obj['settings_language_unset_description_success']);
                        } catch (err) {
                            await Util.editReply(interaction, lang.obj['settings_language_unset_title_failed'], lang.obj['settings_language_unset_description_failed']);
                        }
                        break;
                    default:
                        await Util.editReply(interaction, 'Invalid Subcommand Group', `You used an invalid /settings subcommand group (${subcommandgroup}`);
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
                    await Util.editReply(interaction, lang.obj['settings_reset_title_success'], lang.obj['settings_reset_description_success']);
                } catch (err) {
                    await Util.editReply(interaction, lang.obj['settings_reset_title_failed'], `${lang.obj['settings_reset_description_failed']}${err}`);
                }
                break;
            case 'help': // /settings ? help
                let helpTitle = '';
                let helpDescription = '';
                switch (subcommandgroup) {
                    case 'mods': // /settings mods help
                        helpTitle = lang.obj['settings_mods_help'];
                        helpDescription = `\`/settings mods add <role or user>\` - ${lang.obj['settings_mods_add']}` +
                                        `\`/settings mods remove <role or user>\` - ${lang.obj['settings_mods_remove']}` +
                                        `\`/settings mods show\` - ${lang.obj['settings_mods_show']}`;
                        break;
                    case 'channels': // /settings channels help
                        helpTitle = lang.obj['settings_channels_help'];
                        helpDescription = `\`/settings channels add <role or user>\` - ${lang.obj['settings_channels_add']}` +
                                        `\`/settings channels remove <role or user>\` - ${lang.obj['settings_channels_remove']}` +
                                        `\`/settings channels show\` - ${lang.obj['settings_channels_show']}`;
                        break;
                    case 'language': // /settings language help
                        helpTitle = lang.obj['settings_language_help'];
                        helpDescription = `\`/settings language set <language code>\` - ${lang.obj['settings_language_set']}` +
                                        `\`/settings language unset\` - ${lang.obj['settings_language_unset']}` +
                                        `\`/settings channels show\` - ${lang.obj['settings_language_show']}`;
                        break;
                    default:
                        helpTitle = lang.obj['settings_help'];
                        helpDescription = `\`/settings mods add <role or user>\` - ${lang.obj['settings_mods_add']}` +
                                        `\`/settings mods remove <role or user>\` - ${lang.obj['settings_mods_remove']}` +
                                        `\`/settings mods show\` - ${lang.obj['settings_mods_show']}` +
                                        `\`/settings channels add <role or user>\` - ${lang.obj['settings_channels_add']}` +
                                        `\`/settings channels remove <role or user>\` - ${lang.obj['settings_channels_remove']}` +
                                        `\`/settings channels show\` - ${lang.obj['settings_channels_show']}` +
                                        `\`/settings language set <language code>\` - ${lang.obj['settings_language_set']}` +
                                        `\`/settings language unset\` - ${lang.obj['settings_language_unset']}` +
                                        `\`/settings language show\` - ${lang.obj['settings_language_show']}` +
                                        `\`/settings reset\` - ${lang.obj['settings_reset']}` +
                                        `\`/settings show\` - ${lang.obj['settings_show']}`;
                        break;
                }
                await Util.editReply(interaction, helpTitle, helpDescription);
                break;
            default:
                await Util.editReply(interaction, 'Invalid Subcommand', `You used an invalid /settings subcommand (${subcommand}`);
                break;
        }
        // returnEmbed(title, message, image=null);
    }

    static getRegisterObject() {
        return {
            name: 'settings',
            description: 'View or set settings in an ephemeral message',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'mods',
                    description: 'View, add or remove bot mods',
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    options: [
                        {
                            name: 'add',
                            description: 'Add a bot mod',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'mentionable',
                                    description: 'The user or role to add as a bot mod',
                                    required: true,
                                    type: ApplicationCommandOptionType.Mentionable
                                }
                            ]
                        },
                        {
                            name: 'remove',
                            description: 'Remove a bot mod',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'mentionable',
                                    description: 'The user or role to remove from the bot mods',
                                    required: true,
                                    type: ApplicationCommandOptionType.Mentionable
                                }
                            ]
                        },
                        {
                            name: 'show',
                            description: 'Shows the current mods',
                            type: ApplicationCommandOptionType.Subcommand
                        },
                        {
                            name: 'help',
                            description: 'Shows help for mod settings',
                            type: ApplicationCommandOptionType.Subcommand
                        }
                    ]
                },
                {
                    name: 'channels',
                    description: 'View, add or remove channels in which the bot responds',
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    options: [
                        {
                            name: 'add',
                            description: 'Add a channel in which the bot responds',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'channel',
                                    description: 'The channel in which the bot should start responding',
                                    required: true,
                                    type: ApplicationCommandOptionType.Channel
                                }
                            ]
                        },
                        {
                            name: 'remove',
                            description: 'Remove a channel from the channels in which the bot responds',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'channel',
                                    description: 'The channel in which the bot should stop responding',
                                    required: true,
                                    type: ApplicationCommandOptionType.Channel
                                }
                            ]
                        },
                        {
                            name: 'show',
                            description: 'Shows the current channels in which the bot responds',
                            type: ApplicationCommandOptionType.Subcommand
                        },
                        {
                            name: 'help',
                            description: 'Shows help for mod settings',
                            type: ApplicationCommandOptionType.Subcommand
                        }
                    ]
                },
                {
                    name: 'language',
                    description: 'View, set or unset a preferred language',
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    options: [
                        {
                            name: 'set',
                            description: 'Set the preferred language for this server',
                            type: ApplicationCommandOptionType.Subcommand,
                            options: [
                                {
                                    name: 'language',
                                    description: 'The language code of your preferred language (e.g. en_US)',
                                    required: true,
                                    type: ApplicationCommandOptionType.String
                                }
                            ]
                        },
                        {
                            name: 'unset',
                            description: 'Unsets your preferred language for this server',
                            type: ApplicationCommandOptionType.Subcommand
                        },
                        {
                            name: 'show',
                            description: 'Shows your currently set preferred language for this server',
                            type: ApplicationCommandOptionType.Subcommand
                        },
                        {
                            name: 'help',
                            description: 'Shows help for language settings',
                            type: ApplicationCommandOptionType.Subcommand
                        }
                    ]
                },
                {
                    name: 'reset',
                    description: 'Resets the current settings',
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: 'help',
                    description: 'Shows Help for the /settings command',
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        };
    }
}
