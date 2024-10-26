import { EmbedBuilder, AttachmentBuilder, Message } from "discord.js";

const databaseKeys = ["artwork", "configuration", "leaderboard", "pokemon"];

/*
UTILITIES
*/

// Check Replit database on start to make sure no values are set as null
export async function checkDatabase(db) {
  let list = (await db.list()).split("\n");
  if (databaseKeys.every((item) => list.includes(item))) {
    console.log("Database is ready.");
  } else {
    instantiateDatabase(db); // Set Database Keys
  }
}

// Set first values in database
function instantiateDatabase(db) {
  console.log("Instantiating database for the first time.");

  // Set blank configuration
  const configuration = {
    configuration: {
      channels: [],
      roles: [],
    },
  };

  db.set("configuration", JSON.stringify(configuration));

  // Set blank pokemon
  db.set("pokemon", "");

  // Set blank leaderboard
  db.set("leaderboard", JSON.stringify({}));
}

// Wraps reply in poke-guesser themed embed
export function embedReply(
  title,
  description,
  msg,
  image = null,
  actionRow = null,
  useFollowUp = false,
) {
  // Creates new embedded message
  let embed = new EmbedBuilder()
    .setTitle(title) // Adds title
    .setAuthor({
      name: "POKé-GUESSER BOT",
      iconURL:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
      url: "https://github.com/GeorgeCiesinski/poke-guesser-bot",
    })
    .setColor(0x00ae86)
    .setDescription(description) // Adds message
    .setThumbnail(
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
    )
    .setFooter({
      text: "By borreLore, Wissididom and Crue Peregrine",
      iconURL:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
    });

  if (image) {
    const attachment = new AttachmentBuilder(image, { name: "pokemon.png" });
    embed.setImage("attachment://pokemon.png");
    if (msg instanceof Message) {
      msg.channel.send({
        embeds: [embed],
        files: [attachment],
        components: actionRow ? [actionRow] : [],
      }); // Sends the embedded message back to channel
    } else {
      if (useFollowUp) {
        msg.followUp({
          embeds: [embed],
          files: [attachment],
          components: actionRow ? [actionRow] : [],
        }); // Sends the embedded message back to channel
      } else {
        msg.editReply({
          embeds: [embed],
          files: [attachment],
          components: actionRow ? [actionRow] : [],
        }); // Sends the embedded message back to channel
      }
    }
    return;
  }

  if (msg instanceof Message)
    msg.channel.send({
      embeds: [embed],
      components: actionRow ? [actionRow] : [],
    });
  // Sends the embedded message back to channel
  else
    msg.editReply({
      embeds: [embed],
      components: actionRow ? [actionRow] : [],
    });
}

// Capitalizes first letter of pokemon name
export function capitalize(string) {
  return string[0].toUpperCase() + string.slice(1).toLowerCase();
}

export function parseIfJson(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}
