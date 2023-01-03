import * as DotEnv from 'dotenv';
DotEnv.config();

import { Client, GatewayIntentBits, Partials } from "discord.js";
import Commands from './commands';

const client = new Client({intents: [
    GatewayIntentBits.Guilds,
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

const mySecret = process.env['TOKEN'];

// Outputs console log when bot is logged in and registers all commands
client.on("ready", async () => {
    console.log(`Logged in as ${client.user?.tag}!`);  // Logging
    const registerObject = Commands.getRegisterObject();
    await client.application?.commands.create(registerObject.help);
    await client.application?.commands.create(registerObject.settings);
    await client.application?.commands.create(registerObject.leaderboard);
    await client.application?.commands.create(registerObject.score);
    await client.application?.commands.create(registerObject.explore);
    await client.application?.commands.create(registerObject.reveal);
    await client.application?.commands.create(registerObject.mod);
    process.kill(process.pid, 'SIGTERM');
});

if (!mySecret) {
    console.log("TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.");
    process.kill(process.pid, 'SIGTERM');  // Kill Bot
  } else {
    // Logs in with secret TOKEN
    client.login(mySecret);
  }
