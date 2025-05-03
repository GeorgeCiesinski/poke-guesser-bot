import "dotenv/config";
/*
LIBRARIES
*/

import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextInputStyle,
  TextInputBuilder,
  MessageFlags,
  ModalBuilder,
} from "discord.js";
import Database from "./database.js";

/*
IMPORTED FUNCTIONS
*/
import { checkDatabase, embedReply, capitalize, parseIfJson } from "./util.js";
import { generatePokemon, fetchSprite, fetchNames } from "./pokemon.js";
import {
  addScore,
  showLeaderboard,
  position,
  newChampionship,
  emptyLeaderboard,
  addUser,
  removeUser,
  setUser,
} from "./leaderboard.js";
import {
  showConfig,
  resetConfig,
  addRole,
  removeRole,
  authenticateRole,
  addChannel,
  removeChannel,
  authenticateChannel,
} from "./configure.js";

/*
OBJECTS, TOKENS, GLOBAL VARIABLES
*/

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

const db = new Database(); // SQLite Database

const mySecret = process.env["TOKEN"]; // Discord Token

let guessEntered = false;

/*
PLAYER COMMANDS

checkInput() checks any command inputted after $

Any functions called by checkInput() should either be organized in one of the imported files, or should be placed below checkInput() if it doesn't belong in the other files. 
*/

// Checks pokemon guess
function checkInput(inputRequest, msg) {
  // Player Guess
  if (inputRequest.startsWith("catch ") && guessEntered === false) {
    guessEntered = true; // Lock catch until complete

    const guess = msg.content.split("catch ")[1]; // Splits at the command, gets pokemon name guess
    console.log(`${msg.author} guessed ${guess}.`);
    // Checks if the guess is part of the pokemon name
    db.get("pokemon")
      .then((pokemon) => parseIfJson(pokemon))
      .then(async (pokemon) => {
        // If no pokemon set
        if (pokemon === "") {
          console.log("No pokemon set.");
          guessEntered = false; // Reset guessEntered
          await msg.channel.messages
            .fetch({ limit: 100 })
            .then(async (messages) => {
              const botMessage = messages.find(
                (message) => message.author.id == msg.client.user.id,
              );
              if (botMessage) {
                try {
                  await botMessage.edit({
                    components: [],
                  });
                } catch (err) {
                  // Ignore if it doesn't work, because that is prohbably just because the message has neither embed nor content
                  // Assuming it is a deferred interaction message
                }
              }
            })
            .catch((err) => {
              console.error(
                "Failed to fetch most recent messages to remove the components:",
                err,
              );
            });
          return;
        }
        // Loop through pokemon names and check against guess
        console.log(`pokemon:${JSON.stringify(pokemon)}`);
        for (let i = 0; i < pokemon.length; i++) {
          if (
            pokemon[i].name
              ? pokemon[i].name.toLowerCase() === guess.toLowerCase()
              : pokemon[i].toLowerCase() === guess.toLowerCase()
          ) {
            db.set("pokemon", ""); // Sets current pokemon to empty string

            db.get("artwork").then(async (artwork) => {
              let title, message;
              // Send msg to addScore - id will be extrapolated
              addScore(msg, db);
              // Find english index
              let englishIndex = 1;
              for (let i = 0; i < pokemon.length; i++) {
                if (pokemon[i].languageName === "en") englishIndex = i;
              }
              // Send message that guess is correct
              if (
                (pokemon[i].name
                  ? pokemon[i].name
                  : pokemon[i]
                ).toLowerCase() === pokemon[englishIndex].name.toLowerCase()
              )
                title = `${capitalize(pokemon[englishIndex].name)} has been caught!`;
              else
                title = `${capitalize(pokemon[englishIndex].name)} (${capitalize(pokemon[i].name ? pokemon[i].name : pokemon[i])}) has been caught!`;
              message = `1 point added to ${msg.author}'s score.'
              
              \`/position\`: see your current position
              \`/leaderboard\`: see the updated leaderboard`;
              await embedReply(title, message, msg, artwork);
              await msg.channel.messages
                .fetch({ limit: 100 })
                .then(async (messages) => {
                  const botMessage = messages.find(
                    (innerMsg) => innerMsg.author.id == msg.client.user.id,
                  );
                  if (botMessage) {
                    try {
                      botMessage.edit({
                        components: [],
                      });
                    } catch (err) {
                      // Ignore if it doesn't work, because that is prohbably just because the message has neither embed nor content
                      // Assuming it is a deferred interaction message
                    }
                  }
                })
                .catch((err) => {
                  console.error(
                    "Failed to fetch most recent messages to remove the components:",
                    err,
                  );
                });
            });
            break; // To avoid scoring multiple times
          }
        }
        guessEntered = false; // Reset guessEntered
      });
  }

  // Display Leaderboard
  if (inputRequest === "leaderboard") {
    showLeaderboard(msg, db);
  }
}

/*
BOT ON

This section runs when the bot is logged in and listening for commands. First, it writes a log to the console indicating it is logged in. Next, it listens on the server and determines whether a message starts with ! or $ before calling either function.
*/

// Outputs console log when bot is logged in
client.on(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`); // Logging
});

// Reads user messages, interprets commands & guesses, and authenticates channels/roles
client.on(Events.MessageCreate, (msg) => {
  // Returns if message is from bot
  if (msg.author.bot) return;

  // Authenticate if bot is allowed to reply on this channel
  authenticateChannel(msg, db).then((authorized) => {
    // Returns if channel is not in config
    if (authorized === false) return;

    // Check if user message starts with $ indicating guess, call checkGuess
    if (msg.content.startsWith("$")) {
      const inputRequest = msg.content.split("$")[1];
      console.log(`player command:${inputRequest}`);
      checkInput(inputRequest, msg);
    }
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  await interactionCreate(interaction);
});

let interactionCreate = async (interaction) => {
  if (interaction.isModalSubmit()) return;
  if (interaction.isButton()) {
    if (interaction.customId == "catchBtn") {
      let modal = new ModalBuilder()
        .setTitle("Catch This Pokémon!")
        .setCustomId(`catchModal-${interaction.id}`)
        .setComponents(
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setCustomId("guess")
              .setLabel("Pokémon Name")
              .setStyle(TextInputStyle.Short),
          ),
        );
      await interaction.showModal(modal);
      try {
        let submitted = await interaction
          .awaitModalSubmit({
            filter: (i) =>
              i.customId == `catchModal-${interaction.id}` &&
              i.user.id == interaction.user.id,
            time: 60000,
          })
          .catch((err) => {
            console.error(err);
          });
        if (submitted) {
          if (await catchModalSubmitted(interaction, submitted, db)) {
            await interaction.editReply({
              //embeds: interaction.message.embeds,
              components: [],
            });
          }
        }
        console.log(`Submitted Type: ${submitted.type}`);
      } catch (e) {
        console.error("Timed out", e);
        interaction.followUp({
          content: "Modal timed out (> 60 seconds)",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    return;
  }
  if (!interaction.deferred) {
    if (interaction.commandName == "mod") {
      if (interaction.options.getSubcommand() == "newchampionship") {
        await interaction.deferReply();
      } else {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
    } else {
      await interaction.deferReply();
    }
  }
  if (interaction.commandName == "ping") {
    embedReply("Pong!", "Beep-boop! Poke-guesser-bot is running!", interaction);
    return;
  }
  let channelAllowed = await authenticateChannel(interaction, db);
  if (channelAllowed) {
    let roleAllowed = await authenticateRole(interaction, db);
    if (roleAllowed) {
      switch (interaction.commandName) {
        case "showconfig": {
          showConfig(interaction, db);
          break;
        }
        case "resetconfig": {
          resetConfig(interaction, db);
          break;
        }
        case "addrole": {
          addRole(interaction.options.getRole("role"), interaction, db);
          break;
        }
        case "removerole": {
          removeRole(interaction.options.getRole("role"), interaction, db);
          break;
        }
        case "addchannel": {
          addChannel(
            interaction.options.getChannel("channel"),
            interaction,
            db,
          );
          break;
        }
        case "removechannel": {
          removeChannel(
            interaction.options.getChannel("channel"),
            interaction,
            db,
          );
          break;
        }
        case "explore": {
          console.log("Generating a new pokemon.");
          // Returns pokemon json object
          var pokemon = await generatePokemon();
          let pokemonNames = [pokemon.url.replace(/.+\/(\d+)\//g, "$1")];
          let names = await fetchNames(pokemonNames[0]);
          if (!names) {
            console.log(
              `Warning: 404 Not Found for pokemon ${pokemonNames[0]}. Fetching new pokemon.`,
            );
            await interactionCreate(interaction);
            return;
          }
          for (let name of names) {
            pokemonNames.push(name); // available properties: name, languageName and languageUrl
          }
          console.log(pokemonNames);
          db.set("pokemon", JSON.stringify(pokemonNames)); // Sets current pokemon (different languages) names in database
          // Gets sprite url, and replies to the channel with newly generated pokemon
          let sprites = await fetchSprite(pokemon.url);
          const spriteUrl = sprites.front_default;
          if (!spriteUrl) {
            console.log(
              `Warning: front_default sprite for ${pokemon.name} is null. Fetching new pokemon.`,
            );
            interactionCreate(interaction);
            return;
          }
          const officialArtUrl =
            sprites.other["official-artwork"].front_default;
          console.log(spriteUrl);
          console.log(officialArtUrl);
          // Set official artwork url in database
          db.set("artwork", officialArtUrl); // Sets official art url in database
          const title = "A wild POKEMON appeared!";
          const message =
            "Type `$catch _____` with the correct pokemon name to catch this pokemon!";
          let actionRow = new ActionRowBuilder().setComponents(
            new ButtonBuilder()
              .setCustomId("catchBtn")
              .setLabel("Catch This Pokémon!")
              .setStyle(ButtonStyle.Primary),
          );
          embedReply(title, message, interaction, spriteUrl, actionRow);
          break;
        }
        case "reveal": {
          pokemon = await db
            .get("pokemon")
            .then((pokemon) => parseIfJson(pokemon));
          if (pokemon === "") {
            console.log(
              "Admin requested reveal, but no pokemon is currently set.",
            );
            const title = "There is no pokemon to reveal";
            const message =
              "You have to explore to find a pokemon. Type `!explore` to find a new pokemon.";
            embedReply(title, message, interaction);
          } else {
            let pokemonNames = [pokemon[0]];
            for (let i = 1; i < pokemon.length; i++) {
              let lowercaseName = pokemon[i].name.toLowerCase();
              if (!pokemonNames.includes(lowercaseName))
                pokemonNames.push(lowercaseName.toLowerCase());
            }

            let englishIndex = 0; // Find english index
            for (let i = 1; i < pokemon.length; i++) {
              if (pokemon[i].languageName === "en") englishIndex = i;
            }

            // build string to put in between brackets
            let inBrackets = "";
            for (let i = 0; i < pokemonNames.length; i++) {
              if (inBrackets == "") inBrackets = capitalize(pokemonNames[i]);
              else inBrackets += ", " + capitalize(pokemonNames[i]);
            }
            console.log(
              `Admin requested reveal: ${pokemon[englishIndex].name} (${inBrackets})`,
            );
            const title = "Pokemon escaped!";
            const message = `As you approached, the pokemon escaped, but you were able to catch a glimpse of ${capitalize(pokemon[englishIndex].name)} (${inBrackets}) as it fled.`;
            await db.set("pokemon", ""); // Sets current pokemon to empty string
            await interaction.channel.messages
              .fetch({ limit: 100 })
              .then(async (messages) => {
                const botMessage = messages.find(
                  (msg) =>
                    msg.author.id == interaction.client.user.id &&
                    msg.interaction?.commandName != "reveal",
                );
                if (botMessage) {
                  try {
                    await botMessage.edit({
                      components: [],
                    });
                  } catch (err) {
                    // Ignore if it doesn't work, because that is prohbably just because the message has neither embed nor content
                    // Assuming it is a deferred interaction message
                  }
                }
              })
              .catch((err) => {
                console.error(
                  "Failed to fetch most recent messages to remove the components:",
                  err,
                );
              });
            await embedReply(title, message, interaction);
          }
          break;
        }
        case "mod": {
          await mod(interaction, db);
          break;
        }
      }
    }
    switch (interaction.commandName) {
      case "leaderboard": {
        showLeaderboard(interaction, db);
        break;
      }
      case "position": {
        position(interaction, db);
        break;
      }
      default: {
        if (roleAllowed) {
          await interaction.editReply({
            content: "You ran an non-existant command (how?)",
          });
        } else {
          await interaction.editReply({
            content: "Role not allowed",
          });
        }
      }
    }
  } else {
    await interaction.editReply({
      content: "Channel not allowed",
    });
  }
};

async function mod(interaction, db) {
  const subcommandgroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();
  switch (subcommandgroup) {
    case "score": // /mod score ?
      // See default case
      break;
    case "delay": // /mod delay ?
      // TODO
      break;
    case "timeout": // /mod timeout ?
      // TODO
      break;
    case "championship": // /mod championship ?
      // See default case
      break;
    default:
      switch (subcommand) {
        case "score":
          let user = interaction.options.getUser("user") || interaction.user;
          let action = interaction.options.getString("action");
          let amount = interaction.options.getInteger("amount");
          switch (action) {
            case "add":
              await addUser(interaction, db);
              break;
            case "remove":
              await removeUser(interaction, db);
              break;
            case "set":
              await setUser(interaction, db);
              break;
            default:
              let defaultEmbed = new EmbedBuilder()
                .setTitle("Invalid action")
                .setAuthor({
                  name: "POKé-GUESSER BOT",
                  iconURL:
                    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
                  url: "https://github.com/GeorgeCiesinski/poke-guesser-bot",
                })
                .setColor(0x00ae86)
                .setDescription(
                  `You used an invalid \`/mod score <action>\` action (${action})`,
                )
                .setThumbnail(
                  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
                )
                .setImage(artwork)
                .setFooter({
                  text: "By borreLore, Wissididom and Crue Peregrine",
                  iconURL:
                    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
                });
              await interaction.editReply({
                embeds: [embed],
              });
              break;
          }
          break;
        case "newchampionship":
          newChampionship(interaction, db);
          break;
      }
      break;
  }
}

async function catchModalSubmitted(btnInteraction, modalInteraction, db) {
  await modalInteraction.deferUpdate(); //PokeBot is thinking
  guessEntered = true;
  const guess = modalInteraction.fields.getTextInputValue("guess");
  console.log(`${modalInteraction.user.tag} guessed ${guess}`);
  if (
    (modalInteraction.guild && !modalInteraction.guild.available) ||
    !modalInteraction.guild
  )
    return;
  // Checks if the guess is part of the pokemon name
  db.get("pokemon")
    .then((pokemon) => parseIfJson(pokemon))
    .then(async (pokemon) => {
      // If no pokemon set
      if (pokemon === "") {
        console.log("No pokemon set.");
        guessEntered = false; // Reset guessEntered
        let embed = new EmbedBuilder()
          .setTitle("No pokemon set")
          .setAuthor({
            name: "POKé-GUESSER BOT",
            iconURL:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
            url: "https://github.com/GeorgeCiesinski/poke-guesser-bot",
          })
          .setColor(0x00ae86)
          .setDescription(
            "There is no pokemon set. A person with the appropriate permissions needs to explore first",
          )
          .setThumbnail(
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
          )
          .setFooter({
            text: "By borreLore, Wissididom and Crue Peregrine",
            iconURL:
              "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
          });
        let followUpMsg = await btnInteraction.followUp({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
        await btnInteraction.channel.messages
          .fetch({ limit: 100 })
          .then(async (messages) => {
            const botMessage = messages.find(
              (msg) =>
                msg.author.id == btnInteraction.client.user.id &&
                msg.id != followUpMsg.id,
            );
            if (botMessage) {
              try {
                await botMessage.edit({
                  components: [],
                });
              } catch (err) {
                // Ignore if it doesn't work, because that is prohbably just because the message has neither embed nor content
                // Assuming it is a deferred interaction message
              }
            }
          })
          .catch((err) => {
            console.error(
              "Failed to fetch most recent messages to remove the components:",
              err,
            );
          });
        return;
      }
      // Loop through pokemon names and check against guess
      console.log(`pokemon:${JSON.stringify(pokemon)}`);
      let correct = false;
      for (let i = 0; i < pokemon.length; i++) {
        if (
          pokemon[i].name
            ? pokemon[i].name.toLowerCase() === guess.toLowerCase()
            : pokemon[i].toLowerCase() === guess.toLowerCase()
        ) {
          db.set("pokemon", ""); // Sets current pokemon to empty string
          await db.get("artwork").then(async (artwork) => {
            let title, message;
            // Send msg to addScore - id will be extrapolated
            addScore(btnInteraction, db);
            // Find english index
            let englishIndex = 1;
            for (let i = 0; i < pokemon.length; i++) {
              if (pokemon[i].languageName === "en") englishIndex = i;
            }
            // Send message that guess is correct
            if (
              (pokemon[i].name ? pokemon[i].name : pokemon[i]).toLowerCase() ===
              pokemon[englishIndex].name.toLowerCase()
            )
              title = `${capitalize(pokemon[englishIndex].name)} has been caught!`;
            else
              title = `${capitalize(pokemon[englishIndex].name)} (${capitalize(pokemon[i].name ? pokemon[i].name : pokemon[i])}) has been caught!`;
            message = `1 point added to ${btnInteraction.user}'s score.'
                          
                          \`/position\`: see your current position
                          \`/leaderboard\`: see the updated leaderboard`;
            let embed = new EmbedBuilder()
              .setTitle(title)
              .setAuthor({
                name: "POKé-GUESSER BOT",
                iconURL:
                  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
                url: "https://github.com/GeorgeCiesinski/poke-guesser-bot",
              })
              .setColor(0x00ae86)
              .setDescription(message)
              .setThumbnail(
                "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
              )
              .setImage(artwork)
              .setFooter({
                text: "By borreLore, Wissididom and Crue Peregrine",
                iconURL:
                  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
              });
            let followUpMsg = await btnInteraction.followUp({
              embeds: [embed],
            });
            await btnInteraction.channel.messages
              .fetch({ limit: 100 })
              .then(async (messages) => {
                const botMessage = messages.find(
                  (msg) =>
                    msg.author.id == btnInteraction.client.user.id &&
                    msg.id != followUpMsg.id,
                );
                if (botMessage) {
                  try {
                    await botMessage.edit({
                      components: [],
                    });
                  } catch (err) {
                    // Ignore if it doesn't work, because that is prohbably just because the message has neither embed nor content
                    // Assuming it is a deferred interaction message
                  }
                }
              })
              .catch((err) => {
                console.error(
                  "Failed to fetch most recent messages to remove the components:",
                  err,
                );
              });
            correct = true;
          });
          break; // To avoid scoring multiple times
        }
      }
      guessEntered = false; // Reset gues
      if (!correct) {
        await btnInteraction.followUp({
          content: `Incorrect guess (\`${guess}\`)`,
          flags: MessageFlags.Ephemeral,
        });
      }
    });
}

/*
BOT START CODE (login, start server, etc)

This section checks if there is a TOKEN secret and uses it to login if it is found. If not, the bot outputs a log to the console and terminates.
*/

if (mySecret === undefined) {
  console.log(
    "TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.",
  );

  process.kill(process.pid, "SIGTERM"); // Kill Bot
} else {
  await db.initDb();
  // Check database on start (prevents null errors)
  checkDatabase(db);

  // Logs in with secret TOKEN
  client.login(mySecret);
}
