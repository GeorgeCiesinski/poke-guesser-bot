import * as DotEnv from 'dotenv';
import {
    Client,
    GatewayIntentBits,
    Partials,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    InteractionResponse,
    GuildChannel,
    ActionRow
} from 'discord.js';
import Commands from './commands';
import Language from './language';
import Util from './util';
import Database from './data/postgres';

DotEnv.config();

const mySecret = process.env['TOKEN']; // Discord Token

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
], partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction
]}); // Discord Object

const db = new Database();

client.on("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`) // Logging
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.guild?.available) return;
    if (!interaction.guildId) return;
    if (interaction.isChatInputCommand()) {
        if (interaction.channel) {
            if (await db.isAllowedChannel(interaction.channel as GuildChannel) || !(await db.isAnyAllowedChannel(interaction.guildId))) {
                switch (interaction.commandName) {
                    case 'help':
                        Commands.help(interaction, db);
                        break;
                    case 'settings':
                        Commands.settings(interaction, db);
                        break;
                    case 'leaderboard':
                        Commands.leaderboard(interaction, db);
                        break;
                    case 'score':
                        Commands.score(interaction, db);
                        break;
                    case 'explore':
                        Commands.explore(interaction, db);
                        break;
                    case 'reveal':
                        Commands.reveal(interaction, db);
                        break;
                    case 'mod':
                        Commands.mod(interaction, db);
                        break;
                }
            } else {
                const lang = await Language.getLanguage(interaction.guildId, db);
                interaction.reply({
                    embeds: [
                        Util.returnEmbed(lang.obj['channel_forbidden_error_title'], lang.obj['channel_forbidden_error_description'], lang).embed
                    ],
                    ephemeral: true
                });
            }
        } else {
            await interaction.reply({
                content: 'interactionCreate -> interaction.channel is either null or undefined',
                ephemeral: true
            });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId == 'catchBtn') {
            const lang = await Language.getLanguage(interaction.guildId, db);
            let modal = new ModalBuilder().setTitle(lang.obj['catch_this_pokemon']).setCustomId('catchModal').setComponents(
                new ActionRowBuilder<TextInputBuilder>().setComponents(new TextInputBuilder().setCustomId('guess').setLabel(lang.obj['catch_pokemon_name']).setMaxLength(100).setMinLength(1).setPlaceholder(lang.obj['catch_pokemon_name']).setStyle(TextInputStyle.Short))
            );
            await interaction.showModal(modal);
            let submitted = await interaction.awaitModalSubmit({
                filter: i => i.customId == 'catchModal' && i.user.id == interaction.user.id,
                time: 60000
            }).catch(err => {
                console.error(err);
            });
            if (submitted) {
                if (await Commands.catchModalSubmitted(interaction, submitted, db)) {
                    await interaction.editReply({
                        //embeds: interaction.message.embeds,
                        components: []
                    });
                }
            }
        }
    }
});

// Gracefully disconnect Postgres-Client on exit
if (process.platform === 'win32') {
    let rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on("SIGINT", () => {
        // process.emit('SIGINT', 0);
        process.exit();
    });
}

// Bot Login
if (!mySecret) {
    console.log("TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.");
} else {
    client.login(mySecret);
}
