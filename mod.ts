import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
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
    }

    static getRegisterObject() {
        return new SlashCommandBuilder()
        .setName('mod')
        .setNameLocalizations({
            'de': 'mod'
        })
        .setDescription('Manage delay, timeout and score')
        .setDescriptionLocalizations({
            'de': 'Verzögerung, Auszeit und Punktzahl verwalten'
        })
        .addSubcommandGroup(subcommandgroup =>
            subcommandgroup
            .setName('score')
            .setNameLocalizations({
                'de': 'punktzahl'
            })
            .setDescription('Manage the score of someone')
            .setDescriptionLocalizations({
                'de': 'Die Punktzahl eines Benutzers verwalten'
            })
            .addSubcommand(subcommand =>
                subcommand
                .setName('add')
                .setNameLocalizations({
                    'de': 'hinzufügen'
                })
                .setDescription('Add a score to a user')
                .setDescriptionLocalizations({
                    'de': 'Punktzahl zu einem Benutzer hinzufügen'
                })
                .addUserOption(option =>
                    option
                    .setName('user')
                    .setNameLocalizations({
                        'de': 'benutzer'
                    })
                    .setDescription('The user whose score you want to update')
                    .setDescriptionLocalizations({
                        'de': 'Der Benutzer dessen Punktzahl du anpassen willst'
                    })
                    .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                    .setName('score')
                    .setNameLocalizations({
                        'de': 'punktzahl'
                    })
                    .setDescription('The amount of points you want to add to the score of the user')
                    .setDescriptionLocalizations({
                        'de': 'Die Anzahl der Punkte, die du der Punktzahl des Benutzers hinzufügen willst'
                    })
                )
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('remove')
                .setNameLocalizations({
                    'de': 'entfernen'
                })
                .setDescription('Remove a score from a user')
                .setDescriptionLocalizations({
                    'de': 'Punktzahl eines Benutzers entfernen/verringern'
                })
                .addUserOption(option =>
                    option
                    .setName('user')
                    .setNameLocalizations({
                        'de': 'benutzer'
                    })
                    .setDescription('The user whose score you want to update')
                    .setDescriptionLocalizations({
                        'de': 'Der Benutzer dessen Punktzahl du anpassen willst'
                    })
                    .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                    .setName('score')
                    .setNameLocalizations({
                        'de': 'punktzahl'
                    })
                    .setDescription('The amount of points you want to remove from the user\'s score')
                    .setDescriptionLocalizations({
                        'de': 'Die Anzahl der Punkte, die du der Punktzahl des Benutzers entfernen willst'
                    })
                )
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName('set')
                .setNameLocalizations({
                    'de': 'setzen'
                })
                .setDescription('Set the score of a user')
                .setDescriptionLocalizations({
                    'de': 'Punktzahl eines Benutzers setzen'
                })
                .addUserOption(option =>
                    option
                    .setName('user')
                    .setNameLocalizations({
                        'de': 'benutzer'
                    })
                    .setDescription('The user whose score you want to update')
                    .setDescriptionLocalizations({
                        'de': 'Der Benutzer dessen Punktzahl du anpassen willst'
                    })
                    .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                    .setName('score')
                    .setNameLocalizations({
                        'de': 'punktzahl'
                    })
                    .setDescription('The amount of points you want to set as score of the user')
                    .setDescriptionLocalizations({
                        'de': 'Die Punktzahl, die du beim Benutzers setzen willst'
                    })
                )
            )
        )
        .addSubcommandGroup(subcommandgroup => Delay.getRegisterObject(subcommandgroup))
        .addSubcommandGroup(subcommandgroup => Timeout.getRegisterObject(subcommandgroup))
        .addSubcommandGroup(subcommandgroup => Championship.getRegisterObject(subcommandgroup));
    }
}
