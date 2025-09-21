import {
  BaseInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { Model } from "sequelize";
import Database from "./data/postgres.ts";
import Language from "./language.ts";
import Util from "./util.ts";
import enLocalizations from "./languages/slash-commands/en.json" with {
  type: "json",
};
import deLocalizations from "./languages/slash-commands/de.json" with {
  type: "json",
};

export default class Leaderboard {
  static async leaderboard(
    interaction: ChatInputCommandInteraction,
    db: Database,
  ) {
    await interaction.deferReply(); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    let table = "";
    let longestUserLength: number = 0;
    let userName = "";
    let score = "";
    const scores = await db.getScores(interaction.guildId!);
    const usernameMode = (
      await db.getUsernameMode(interaction.guildId!)
    )?.getDataValue("mode");
    const leaderboardEmbed: EmbedBuilder = Util.returnEmbed(
      lang.obj["leaderboard_title"],
      lang.obj["leaderboard_description"],
      lang,
    ).embed;
    // Add fields to Embed
    for (let i: number = 0; i < Math.max(5, scores.length); i++) {
      const userId = scores[i]?.getDataValue("userId");
      const memberObj = userId
        ? await Util.findMember(interaction, userId)
        : null;
      if (memberObj) {
        if (Array.isArray(memberObj)) {
          userName = Util.getCorrectUsernameFormat(usernameMode, memberObj[0]);
        } else {
          userName = Util.getCorrectUsernameFormat(usernameMode, memberObj);
        }
      } else {
        continue;
      }
      score = scores[i]?.getDataValue("score");
      // If on the first element, and element exists, create champion
      if (i == 0 && i < scores.length) {
        leaderboardEmbed.addFields(
          {
            name: lang.obj["leaderboard_champion"],
            value: lang.obj["leaderboard_all_hail"],
          },
          {
            name: "🏆 " +
              lang.obj["leaderboard_score_name"]
                .replace("<placement>", (i + 1).toString())
                .replace("<username>", userName),
            value: lang.obj["leaderboard_score_value"].replace(
              "<score>",
              score,
            ),
          },
          {
            name: lang.obj["leaderboard_elite_four"],
            value: lang.obj["leaderboard_next_runnerups"],
          },
        );
      } else if (i == 0 && i == scores.length) {
        leaderboardEmbed.addFields(
          {
            name: lang.obj["leaderboard_champion"],
            value: lang.obj["leaderboard_all_hail"],
          },
          {
            name: "🏆 " + lang.obj["leaderboard_score_name"]
              .replace("<placement>", (i + 1).toString())
              .replace("<username>", "TBA"),
            value: lang.obj["leaderboard_position_not_claimed"],
          },
          {
            name: lang.obj["leaderboard_elite_four"],
            value: lang.obj["leaderboard_next_runnerups"],
          },
        );
      }
      // If on element 1-4, and element exists, create new elite four member
      if (i > 0 && i < 5 && i < scores.length) {
        leaderboardEmbed.addFields({
          name: "🏅 " + lang.obj["leaderboard_score_name"]
            .replace("<placement>", (i + 1).toString())
            .replace("<username>", userName),
          value: lang.obj["leaderboard_score_value"].replace("<score>", score),
        });
        // If on element 1-4 but element is empty, create TBA
      } else if (i > 0 && i < 5 && i >= scores.length) {
        leaderboardEmbed.addFields({
          name: lang.obj["leaderboard_score_name"]
            .replace("<placement>", (i + 1).toString())
            .replace("<username>", "TBA"),
          value: lang.obj["leaderboard_position_not_claimed"],
        });
      }
      // Creates table header for overflow leaderboard
      if (i == 5) {
        // Get longest username starting from index 5
        longestUserLength = await Leaderboard.getLongestUsername(
          interaction,
          scores.slice(5),
          usernameMode,
        );
      }
      // Adds additional users into overflow leaderboard up until 20
      // Pad first column to fit double digits, second column by longest username
      if (i >= 5 && i < 20) {
        table += (i + 1).toString().padEnd("00 ".length) +
          "| " +
          userName.padEnd(longestUserLength, " ") +
          " | " +
          score +
          "\n";
      }
    }
    if (scores.length > 5) {
      leaderboardEmbed.addFields({
        name: lang.obj["leaderboard_runnerups"],
        value: `\`\`\`${table}\`\`\``,
      });
    }
    await interaction.editReply({
      embeds: [leaderboardEmbed],
    });
  }

  private static async getLongestUsername(
    interaction: BaseInteraction,
    scores: Model[],
    usernameModeId: number,
  ) {
    let longestUsernameLength: number = 0;
    for (let i: number = 0; i < scores.length; i++) {
      const m: GuildMember | undefined = (await Util.findMember(
        interaction,
        scores[i].getDataValue("userId"),
      )) as GuildMember | undefined;
      if (m) {
        const memberUsername = Util.getCorrectUsernameFormat(usernameModeId, m);
        if (memberUsername.length > longestUsernameLength) {
          longestUsernameLength = memberUsername.length;
        }
      }
    }
    return longestUsernameLength;
  }

  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName(enLocalizations.leaderboard_name)
      .setNameLocalizations({
        de: deLocalizations.leaderboard_name,
      })
      .setDescription(enLocalizations.leaderboard_description)
      .setDescriptionLocalizations({
        de: deLocalizations.leaderboard_description,
      });
  }
}
