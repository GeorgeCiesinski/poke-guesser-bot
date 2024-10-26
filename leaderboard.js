import Discord from "discord.js";
import Database from "./database.js";

import { embedReply, parseIfJson } from "./util.js";

/*
LEADERBOARD

The leaderboard is a dictionary stored in the replit database under the "leaderboard" key. 

leaderboard = {
  "user1.id": score, 
  "user2.id": score
}

Each row represents a user. The key is the id of the user in discord, and the value is the user's score
*/

// Add score to user
export async function addScore(msg, db) {
  // Get userId from msg
  let userId = msg instanceof Discord.Message ? msg.author.id : msg.user.id;
  let userName =
    msg instanceof Discord.Message ? msg.author.username : msg.user.username;
  console.log(`leaderboard.addScore received userId: ${userId}`);
  console.log(`Adding score to user: ${userName}`);

  // Check the leaderboard if id already exists
  await db
    .get("leaderboard")
    .then((leaderboard) => parseIfJson(leaderboard))
    .then(async (leaderboard) => {
      // Add score if user is in leaderboard, add user to leaderboard if not
      if (!leaderboard) leaderboard = [];
      if (userId in leaderboard) {
        leaderboard[userId] += 1;
      } else {
        leaderboard[userId] = 1;
      }
      // Set database with changes
      await db.set("leaderboard", JSON.stringify(leaderboard));
    });
}

// Sanitizes leaderboard by removing non-existent users which might break other functions
function sanitizeLeaderboard(msg, leaderboard) {
  // Returns a promise
  return new Promise(function (resolve, reject) {
    let promises = [];
    // Iterate through leaderboard object
    for (const [userId, score] of Object.entries(leaderboard)) {
      // Retrieve user from guild, or null if doesn't exist
      const objLength = Object.keys(leaderboard).length;
      promises.push(
        findUser(msg, userId).then((user) => {
          // If user object is null, delete the key from leaderboard
          if (!user) {
            console.log(`Removing User ID ${userId} from leaderboard.`);
            delete leaderboard[userId];
          }
        }),
      );
    }
    Promise.all(promises).then((values) => {
      // Resolves promise and returns leaderboard once fake users removed
      resolve(leaderboard);
    });
  });
}

// Shows Leaderboard by creating a new Embed
export async function showLeaderboard(msg, db, useFollowup = false) {
  /*
  Dynamically generates leaderboard embed depending on the number of users:
  1) 0 users: Generates empty leaderboard with champion and elite four slots showing TBA
  2) 1 user: Only champion is generated, elite four are TBA, and no overflow leaderboard is generated
  3) 2-5 users: Champion is generated, and remaining users fill the elite four slots. No overflow leaderboard is generated
  4) 5+ users: First five users fill the Champion and elite four slots. Remaining users (up to 20) fill the overflow leaderboard

  Function is called using:
  1) !leaderboard/$leaderboard: outputs regular leaderboard 
  */
  let isText = !msg.commandId;

  // Retrieve leaderboard from database
  await db
    .get("leaderboard")
    .then((leaderboard) => parseIfJson(leaderboard))
    .then(async (leaderboard) => {
      if (!leaderboard) {
        if (isText) {
          msg.reply({
            content: "The Leaderboard has not yet been initialized!",
          });
        } else {
          msg.editReply({
            content: "The Leaderboard has not yet been initialized!",
          });
        }
        return;
      }
      return sanitizeLeaderboard(msg, leaderboard);
    })
    .then(async (sanitizedLeaderboard) => {
      console.log(sanitizedLeaderboard);

      if (!sanitizedLeaderboard) {
        // Not sending Error Message, because it already got sent in the earlier .then
        return;
      }

      // Variables for use in loops
      let table = "";
      let longestUserLength = "";
      let userName = "";
      let score = "";

      // Create items array
      let items = Object.keys(sanitizedLeaderboard).map(function (key) {
        return [key, sanitizedLeaderboard[key]];
      });

      // Sort the array based on the score (second element)
      items.sort(function (first, second) {
        return second[1] - first[1];
      });

      console.log(items);

      // Create Embed
      const leaderboardEmbed = new Discord.EmbedBuilder()
        .setTitle("Pokémaster Leaderboard")
        .setAuthor({
          name: "POKé-GUESSER BOT",
          iconURL:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
          url: "https://github.com/GeorgeCiesinski/poke-guesser-bot",
        })
        .setColor(0x00ae86)
        .setDescription("Top 20 Pokémasters in this channel.")
        .setThumbnail(
          "https://raw.githubusercontent.com/GeorgeCiesinski/poke-guesser-bot/master/images/pokemon-trophy.png",
        )
        .setFooter({
          text: "By borreLore, Wissididom and Crue Peregrine",
          iconURL:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png",
        });

      // Add fields to Embed
      for (let i = 0; i < Math.max(5, items.length); i++) {
        // If iteration number is less than or equal to length of array
        if (i < Math.max(0, items.length)) {
          // Get userObject
          let userObject = await findUser(msg, items[i][0]);
          // If userObject, set username
          if (userObject) {
            userName = userObject.username;
          } else {
            userName = items[i][0];
          }

          score = items[i][1];
          // Output item in array to console if exists
          console.log(`${userName}: ${score}`);
        }

        // If on the first element, and element exists, create champion
        if (i == 0 && i < items.length) {
          leaderboardEmbed.addFields(
            { name: "---------- CHAMPION ----------", value: "All hail:" },
            {
              name: `🏆 ${i + 1}. ${userName}`,
              value: `${score} pokémon caught.`,
            },
            {
              name: "--------- ELITE FOUR ---------",
              value: "The next runnerups are:",
            },
          );
          // If on the first element but element is empty, create TBA
        } else if (i == 0 && i == items.length) {
          leaderboardEmbed.addFields(
            { name: "---------- CHAMPION ----------", value: "All hail:" },
            { name: `${i + 1}. TBA`, value: "Position not claimed" },
            {
              name: "--------- ELITE FOUR ---------",
              value: "The next runnerups are:",
            },
          );
        }

        // If on element 1-4, and element exists, create new elite four member
        if (i > 0 && i < 5 && i < items.length) {
          leaderboardEmbed.addFields({
            name: `🏅 ${i + 1}. ${userName}`,
            value: `${score} pokémon caught.`,
          });
          // If on element 1-4 but element is empty, create TBA
        } else if (i > 0 && i < 5 && i >= items.length) {
          leaderboardEmbed.addFields({
            name: `${i + 1}. TBA`,
            value: "Position not claimed",
          });
        }

        // Creates table header for overflow leaderboard
        if (i == 5) {
          // Creates an array of usernames in items starting from index 5
          usernames = Array.from(
            items.slice(5),
            async (x) => await findUser(msg, x[0]),
          );
          // Get the longest username in the array
          const longestUsername = usernames.sort((a, b) => {
            return b.length - a.length;
          })[0];
          longestUserLength = longestUsername.length;
        }

        // Adds additional users into overflow leaderboard up until 20
        // Pad first column to fit double digits, second column by longest username
        if (i >= 5 && i < 20) {
          table +=
            (i + 1 + "").padEnd("00 ".length, " ") +
            "| " +
            userName.padEnd(longestUserLength, " ") +
            " | " +
            score +
            "\n";
        }
      }

      if (items.length > 5) {
        leaderboardEmbed.addFields({
          name: "--------- RUNNERUPS ---------",
          value: "```" + table + "```",
        });
      }

      // Sends the completed Embed
      if (isText) {
        await msg.channel.send({
          embeds: [leaderboardEmbed],
        });
      } else {
        if (useFollowup) {
          await msg.followUp({
            embeds: [leaderboardEmbed],
          });
        } else {
          await msg.editReply({
            embeds: [leaderboardEmbed],
          });
        }
      }

      // Update leaderboard with sanitized leaderboard
      db.set("leaderboard", JSON.stringify(sanitizedLeaderboard));
    });
}

// Shows User Position
export function position(msg, db) {
  db.get("leaderboard")
    .then((leaderboard) => parseIfJson(leaderboard))
    .then((leaderboard) => {
      if (!leaderboard) {
        msg.reply("The Leaderboard has not yet been initialized!");
        return;
      }

      // Create items array
      let items = Object.keys(leaderboard).map(function (key) {
        return [key, leaderboard[key]];
      });

      // Sort the array based on the second element
      items.sort(function (first, second) {
        return second[1] - first[1];
      });

      // Create new array with just ids
      const userIds = Array.from(items, (user) => user[0]);
      console.log(JSON.stringify(userIds));

      const firstMention = msg.mentions.users.first();
      if (firstMention) {
        // !== undefined && !== null
        // Find position of mentioned user
        const userPosition = userIds.indexOf(firstMention.id) + 1;
        replyPosition(msg, firstMention.username, userPosition, true);
      } else {
        // Find position of message author
        const userPosition = userIds.indexOf(msg.author.id) + 1;
        replyPosition(msg, msg.author.username, userPosition, false);
      }
    });
}

function replyPosition(msg, userName, userPosition, mention) {
  if (userPosition === 0) {
    console.log(`${userName} is not on the leaderboard.`);
    if (mention) {
      msg.reply(
        `${userName} is currently not on the leaderboard. ${userName} must guess at least one pokemon first!`,
      );
    } else {
      msg.reply(
        "You are currently not on the leaderboard. You must guess at least one pokemon first!",
      );
    }
  } else {
    console.log(`${userName}'s position: ${userPosition}`);
    if (mention) {
      msg.reply(`${userName}'s current position is: ${userPosition}`);
    } else {
      msg.reply(`Your current position is: ${userPosition}`);
    }
  }
}

// Formally resets leaderboard and announces the end of the championship
export async function newChampionship(interaction, db) {
  // Output message that the championship has ended and x is the victor
  await db
    .get("leaderboard")
    .then((leaderboard) => parseIfJson(leaderboard))
    .then(async (leaderboard) => {
      if (!leaderboard) {
        await interaction.editReply(
          "The Leaderboard has not yet been initialized!",
        );
        return;
      }

      // Output leaderboard
      showLeaderboard(interaction, db, true);

      // Create items array
      let items = Object.keys(leaderboard).map(function (key) {
        return [key, leaderboard[key]];
      });

      // Sort the array based on the second element
      items.sort(function (first, second) {
        return second[1] - first[1];
      });

      const winner = items[0] ? await findUser(interaction, items[0][0]) : null; // Determine winner of championship
      const finalScore = items[0] ? items[0][1] : 0; // Determine winner's final score
      var delayInMilliseconds = 500; // 0.5 seconds

      // Output Championship Victor with delay to allow leaderboard to send first
      setTimeout(async () => {
        const title = "Champion Decided!";
        const message = `As the Championship draws to a close, the victor stands out from the rest of the competitors!
      
      ${winner ? winner : "No one"}
      
      has been declared the top Pokémon Master in the region for catching a grand total of 
      
      ${finalScore} Pokémon 
      
      and is presented with the Pokémon Championship trophy in front of thousands of screaming fans.
      
      The championship begins anew!`;
        const image =
          "https://raw.githubusercontent.com/GeorgeCiesinski/poke-guesser-bot/master/images/pokemon-trophy.png";
        await embedReply(title, message, interaction, image, null, true);

        // Erase leaderboard
        await emptyLeaderboard(interaction, db);
      }, delayInMilliseconds);
    });
}

// Empties leaderboard
export async function emptyLeaderboard(msg, db) {
  const leaderboard = {};
  await db.set("leaderboard", JSON.stringify(leaderboard));
  console.log("Emptied leaderboard.");
}

export async function addUser(interaction, db) {
  const authorId = interaction.user.id;
  const userId = interaction.options.getUser("user").id;
  const action = interaction.options.getString("action");
  const score = interaction.options.getInteger("amount");
  await db
    .get("leaderboard")
    .then((leaderboard) => parseIfJson(leaderboard))
    .then(async (leaderboard) => {
      if (!leaderboard) leaderboard = [];
      if (userId) {
        // user exists
        if (score) {
          // score given -> add to players score
          if (userId in leaderboard) {
            leaderboard[userId] += score;
            await interaction.editReply(
              `Added ${score} points to <@${userId}>'s score!`,
            );
          } else {
            leaderboard[userId] = score;
            await interaction.editReply(
              `Set <@${userId}>'s score to ${score}!`,
            );
          }
        } else {
          // score omitted -> error message if user exists else add to leaderboard with 0 points
          if (userId in leaderboard) {
            await interaction.editReply(
              `<@${userId}> already exists on the leaderboard. Please specify how much points should be added!`,
            );
          } else {
            leaderboard[userId] = 0;
            await interaction.editReply(
              `<@${userId}> added to leaderboard with 0 points`,
            );
          }
        }
        // Set database with changes
        await db.set("leaderboard", JSON.stringify(leaderboard));
      } else {
        // mention does not exist
        await interaction.editReply("Please use !addscore <@user> [<score>]");
      }
    });
}

export async function removeUser(interaction, db) {
  const userId = interaction.options.getUser("user").id;
  const action = interaction.options.getString("action");
  const score = interaction.options.getInteger("amount");
  await db
    .get("leaderboard")
    .then((leaderboard) => parseIfJson(leaderboard))
    .then(async (leaderboard) => {
      if (!leaderboard) leaderboard = [];
      if (userId) {
        // user exists
        if (score) {
          // score given -> subtract score (removing if substract would go negative)
          if (userId in leaderboard) {
            leaderboard[userId] -= score;
            if (leaderboard[userId] < 0) {
              delete leaderboard[userId];
              await interaction.editReply(`Removed <@${userId}>'s score!`);
            } else {
              await interaction.editReply(
                `Removed ${score} points from <@${userId}>'s score!`,
              );
            }
          } else {
            await interaction.editReply(
              `<@${userId}> does not exist on the leaderboard!`,
            );
          }
        } else {
          // score omitted -> removing user from leaderboard if existing on leaderboard
          if (userId in leaderboard) {
            delete leaderboard[userId];
            await interaction.editReply(`Removed <@${userId}>'s score!`);
          } else {
            await interaction.editReply(
              `<@${userId}> does not exist on the leaderboard!`,
            );
          }
        }
        // Set database with changes
        await db.set("leaderboard", JSON.stringify(leaderboard));
      } else {
        // mention does not exist
        await interaction.editReply(
          "Please use !removescore <@user> [<score>]",
        );
      }
    });
  if (userId) {
    if (score) {
      // score given -> subtract score (removing if substract would go negative)
    } else {
      // score omitted -> removing player completely
    }
  }
  console.log(`removeUser: ${score ? "true" : "false"}`);
}

export async function setUser(interaction, db) {
  const authorId = interaction.user.id;
  const userId = interaction.options.getUser("user").id;
  const action = interaction.options.getString("action");
  const score = interaction.options.getInteger("amount");
  await db
    .get("leaderboard")
    .then((leaderboard) => parseIfJson(leaderboard))
    .then(async (leaderboard) => {
      if (!leaderboard) leaderboard = [];
      if (userId) {
        // user exists
        if (score) {
          // score given -> add to players score
          leaderboard[userId] = score;
          await interaction.editReply(
            `Set <@${userId}>'s score to ${score} points!`,
          );
          // Set database with changes
          await db.set("leaderboard", JSON.stringify(leaderboard));
        } else {
          // score omitted -> error message if user exists else add to leaderboard with 0 points
          await interaction.editReply(
            `\`/mod score set\` command can only be used with an amount given! Please use \`/mod score add\` if you want to add someone to the leaderboard with 0 points!`,
          );
        }
      } else {
        // mention does not exist
        await interaction.editReply("Please use !addscore <@user> [<score>]");
      }
    });
}

// Finds the GuildMember by User-IDs (either string or array)
function findMember(messageOrInteraction, ids) {
  // Return member or undefined if not found (force specifies if cache should be checked)
  // I could have omitted the force property, but i have put it there to make it clear
  return messageOrInteraction.guild.members.fetch({ user: ids, force: false });
}

// Finds the User by User-ID
function findUser(messageOrInteraction, id) {
  return findMember(messageOrInteraction, id).then((member) => {
    // If member found, return member, else return null
    if (member) {
      console.log(`User ID ${id} found in guild.`);
      return member.user;
    } else {
      console.log(`WARNING: User ID ${id} not found in guild.`);
      return null;
    }
  });
}
