/*
LIBRARIES
*/

require('dotenv').config();

const { Client, Intents } = require('discord.js');
const Commands = require('./commands.js');
const language = require('./language.js');
const util = require('./util.js');
const db = require('./data/postgres.js');

/*
OBJECTS, TOKENS, GLOBAL VARIABLES
*/

const mySecret = process.env['TOKEN'];  // Discord Token

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES], partials: ['USER', 'CHANNEL', 'GUILD_MEMBER', 'MESSAGE', 'REACTION']}); // Discord Object

/*
BOT ON

This section runs when the bot is logged in and listening for commands. First, it writes a log to the console indicating it is logged in. Next, it listens on the server and determines whether a message starts with ! or $ before calling either the Admin checkCommand function, or the User checkInput function.
*/

// Outputs console log when bot is logged in
client.on("ready", () => {
	console.log(`Logged in as ${client.user.tag}!`);  // Logging
	db.connect();
	db.prepareDb();
});

client.on("interactionCreate", async interaction => {
	if (interaction.isCommand()) {
		if (await db.isAllowedChannel(interaction.channel) || !(await db.isAnyAllowedChannel(interaction.guildId))) {
			switch (interaction.commandName) {
				case 'help':
					Commands.help(interaction, db);
					break;
				case 'settings':
					Commands.settings(interaction, db);
					break;
				case 'catch':
					Commands._catch(interaction, db);
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
			const lang = await language.getLanguage(interaction.guildId, db);
			interaction.reply({
				embeds: [util.returnEmbed(lang.obj['channel_forbidden_error_title'], lang.obj['channel_forbidden_error_description'])],
				ephemeral: true
			});
		}
	}
});

// Gracefully disconnect Postgres-Client on exit
if (process.platform === 'win32') {
	let rl = require('readline').createInterface({
		input: process.stdin,
		output: process.stdout
	});
	rl.on('SIGINT', () => {
		process.emit('SIGINT');
	});
}
process.on('SIGINT', async () => {
	await db.disconnect();
	process.exit();
});

// Bot Login
if (!mySecret) {
  console.log("TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.");
} else {
  client.login(mySecret);
}
