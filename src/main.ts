import {
  ActionRowBuilder,
  Client,
  Events,
  GatewayIntentBits,
  GuildChannel,
  Interaction,
  MessageFlags,
  ModalBuilder,
  Partials,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import Commands from "./commands.ts";
import Language from "./language.ts";
import Util from "./util.ts";
import Database from "./data/postgres.ts";

const mySecret = Deno.env.has("TOKEN") ? Deno.env.get("TOKEN") : null; // Discord Token

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
  ],
}); // Discord Object

const db = new Database();

client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user?.tag}!`); // Logging
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.guild?.available) {
    console.warn(
      "Guild not available: interaction.guild.available is either null or false",
    );
    return;
  }
  if (!interaction.guildId) {
    console.warn("Internal Server Error: interaction.guildId is null");
    return;
  }
  if (interaction.isChatInputCommand()) {
    if (interaction.channel) {
      if (
        (await db.isAllowedChannel(interaction.channel as GuildChannel)) ||
        !(await db.isAnyAllowedChannel(interaction.guildId))
      ) {
        switch (interaction.commandName) {
          case "help":
            Commands.help(interaction, db);
            break;
          case "settings":
            Commands.settings(interaction, db);
            break;
          case "leaderboard":
            Commands.leaderboard(interaction, db);
            break;
          case "score":
            Commands.score(interaction, db);
            break;
          case "explore":
            Commands.explore(interaction, db);
            break;
          case "lightning":
            Commands.lightning(interaction, db);
            break;
          case "reveal":
            Commands.reveal(interaction, db);
            break;
          case "mod":
            Commands.mod(interaction, db);
            break;
        }
      } else {
        const lang = await Language.getLanguage(interaction.guildId, db);
        await interaction.reply({
          embeds: [
            Util.returnEmbed(
              lang.obj["channel_forbidden_error_title"],
              lang.obj["channel_forbidden_error_description"],
              lang,
            ).embed,
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    } else {
      await interaction.reply({
        content:
          "interactionCreate -> interaction.channel is either null or undefined",
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isButton()) {
    if (interaction.customId == "catchBtn") {
      const lang = await Language.getLanguage(interaction.guildId, db);
      const modal = new ModalBuilder()
        .setTitle(lang.obj["catch_this_pokemon"])
        .setCustomId("catchModal")
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId("guess")
              .setLabel(lang.obj["catch_pokemon_name"])
              .setMaxLength(100)
              .setMinLength(1)
              .setPlaceholder(lang.obj["catch_pokemon_name"])
              .setStyle(TextInputStyle.Short),
          ),
        );
      await interaction.showModal(modal);
      const submitted = await interaction
        .awaitModalSubmit({
          filter: (i) =>
            i.customId == "catchModal" && i.user.id == interaction.user.id,
          time: 60000,
        })
        .catch((err) => {
          console.error(err);
        });
      if (submitted) {
        if (await Commands.catchModalSubmitted(interaction, submitted, db)) {
          await interaction.editReply({
            //embeds: interaction.message.embeds,
            components: [],
          });
        }
      }
    }
  }
});

if (import.meta.main) {
  // Bot Login
  if (!mySecret) {
    console.log(
      "TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.",
    );
  } else {
    client.login(mySecret);
  }
}
