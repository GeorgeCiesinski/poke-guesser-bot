/**
 * Provides the Sequelize-backed persistence layer for guild settings, scores,
 * active encounters, artwork, explore cooldowns, and lightning state.
 */
import { DataTypes, Model, Sequelize } from "sequelize";
import LanguageApi from "../language.ts";
import Util from "../util.ts";
import { GuildChannel, GuildMember, Role } from "discord.js";

export default class Database {
  private db: Sequelize;

  private Username = class extends Model {};
  private Mod = class extends Model {};
  private Channel = class extends Model {};
  private Language = class extends Model {};
  private Score = class extends Model {};
  private Encounter = class extends Model {
    name: string | null = null;
    language: string | null = null;
  };
  private Artwork = class extends Model {};
  private LastExplore = class extends Model {};
  private Lightning = class extends Model {};

  /**
   * Configures Sequelize, initializes all bot models, and starts schema sync.
   */
  constructor() {
    const databaseUrl = Deno.env.get("DATABASE_URL")?.trim();

    if (databaseUrl) {
      this.db = new Sequelize(databaseUrl, {
        logging: false,
      });
    } else {
      this.db = new Sequelize(
        Deno.env.get("POSTGRES_DB") ?? "pokebot",
        Deno.env.get("POSTGRES_USER") ?? "postgres",
        Deno.env.get("POSTGRES_PASSWORD") ?? "postgres",
        {
          host: Deno.env.get("POSTGRES_HOST") ?? "db",
          port: parseInt(Deno.env.get("POSTGRES_PORT") ?? "5432"),
          dialect: "postgres",
          logging: false,
        },
      );
    }
    this.Username.init(
      {
        /*id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },*/
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mode: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 4,
        },
      },
      {
        sequelize: this.db,
        modelName: "username",
        timestamps: false,
      },
    );
    this.Mod.init(
      {
        /*id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },*/
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mentionableId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isUser: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "mod",
        timestamps: false,
      },
    );
    this.Channel.init(
      {
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        channelId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "channel",
        timestamps: false,
      },
    );
    this.Language.init(
      {
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        languageCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "language",
        timestamps: false,
      },
    );
    this.Score.init(
      {
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        userId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        score: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "score",
        timestamps: false,
      },
    );
    this.Encounter.init(
      {
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        channelId: {
          // If we ever want to make it possible to have multiple guessing games in one server. I set allowNull to true because I think we can make it like `if (channelId == null)` to make independant of channels.
          type: DataTypes.STRING,
          allowNull: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        language: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "encounter",
        timestamps: false,
      },
    );
    this.Artwork.init(
      {
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        channelId: {
          // If we ever want to make it possible to have multiple guessing games in one server. I set allowNull to true because I think we can make it like `if (channelId == null)` to make independant of channels.
          type: DataTypes.STRING,
          allowNull: true,
        },
        url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "artwork",
        timestamps: false,
      },
    );
    this.LastExplore.init(
      {
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        channelId: {
          // If we ever want to make it possible to have multiple guessing games in one server. I set allowNull to true because I think we can make it like `if (channelId == null)` to make independant of channels.
          type: DataTypes.STRING,
          allowNull: true,
        },
        time: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "lastexplore",
        timestamps: false,
      },
    );
    this.Lightning.init(
      {
        serverId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        channelId: {
          // If we ever want to make it possible to have multiple guessing games in one server. I set allowNull to true because I think we can make it like `if (channelId == null)` to make independant of channels.
          type: DataTypes.STRING,
          allowNull: true,
        },
        loops: {
          // Remaining Loops
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize: this.db,
        modelName: "lightning",
        timestamps: false,
      },
    );
    this.prepareDb();
  }

  /**
   * Verifies that the configured database connection can authenticate.
   *
   * @returns A promise that resolves when authentication succeeds.
   */
  async connect(): Promise<void> {
    return await this.db.authenticate();
  }

  /**
   * Synchronizes Sequelize models with the database schema.
   *
   * @returns The Sequelize instance after sync completes.
   */
  async prepareDb(): Promise<Sequelize> {
    return await this.db.sync({ alter: true });
  }

  /**
   * Reads the username display mode configured for a guild.
   *
   * @param serverId The Discord guild id.
   * @returns The stored username mode row, or null when none is configured.
   */
  async getUsernameMode(serverId: string) {
    return await this.Username.findOne({
      where: {
        serverId,
      },
    });
  }

  /**
   * Stores a guild's username display mode.
   *
   * @param serverId The Discord guild id.
   * @param mode The username mode, from 0 through 4.
   * @returns The created row or Sequelize update result.
   */
  async setUsernameMode(serverId: string, mode: number) {
    if (mode < 0 || mode > 4) throw new Error("mode must be between 0 and 4");
    // Modes map to the precedence order implemented in
    // `Util.getCorrectUsernameFormat`.
    const oldMode = await this.getUsernameMode(serverId);
    if (oldMode == null || oldMode == undefined) {
      return await this.Username.create({ serverId, mode });
    } else {
      return await this.Username.update({ mode }, { where: { serverId } });
    }
  }

  /**
   * Adds a user or role to the guild moderator allowlist.
   *
   * @param mentionable The guild member or role to grant moderator access.
   * @returns The created moderator row.
   */
  async addMod(mentionable: GuildMember | Role) {
    const lang = await LanguageApi.getLanguage(mentionable.guild.id, this);
    if (await this.isMod(mentionable)) {
      throw Util.isUser(mentionable)
        ? lang.obj["settings_mods_add_already_existing_user"].replace(
          "{mentionable}",
          `<@!${mentionable.id}>`,
        )
        : lang.obj["settings_mods_add_already_existing_role"].replace(
          "{mentionable}",
          `<@&${mentionable.id}>`,
        );
    } else {
      return await this.Mod.create({
        serverId: mentionable.guild.id,
        mentionableId: mentionable.id,
        isUser: Util.isUser(mentionable),
      });
    }
  }

  /**
   * Removes a user or role from the guild moderator allowlist.
   *
   * @param mentionable The guild member or role to remove.
   * @returns The number of removed rows.
   */
  async removeMod(mentionable: GuildMember | Role): Promise<number> {
    const lang = await LanguageApi.getLanguage(mentionable.guild.id, this);
    if (!(await this.isMod(mentionable))) {
      throw Util.isUser(mentionable)
        ? lang.obj["settings_mods_remove_not_existing_mod_user"].replace(
          "{mentionable}",
          `<@!${mentionable.id}>`,
        )
        : lang.obj["settings_mods_remove_not_existing_mod_role"].replace(
          "{mentionable}",
          `<@&${mentionable.id}>`,
        );
    } else {
      return await this.Mod.destroy({
        where: {
          serverId: mentionable.guild.id,
          mentionableId: mentionable.id,
        },
      });
    }
  }

  /**
   * Lists all moderator allowlist entries for a guild.
   *
   * @param serverId The Discord guild id.
   * @returns All stored moderator rows for the guild.
   */
  async listMods(serverId: string) {
    return await this.Mod.findAll({
      where: {
        serverId,
      },
    });
  }

  /**
   * Checks whether a member or role is on the moderator allowlist.
   *
   * @param mentionable The guild member or role to inspect.
   * @returns True when the mentionable is configured as a moderator.
   */
  async isMod(mentionable: GuildMember | Role | null): Promise<boolean> {
    if (!mentionable) return false;
    return (
      (await this.Mod.count({
        where: {
          serverId: mentionable.guild.id,
          mentionableId: mentionable.id,
        },
      })) > 0
    );
  }

  /**
   * Removes every moderator allowlist entry for a guild.
   *
   * @param serverId The Discord guild id.
   * @returns The number of removed rows.
   */
  async resetMods(serverId: string): Promise<number> {
    return await this.Mod.destroy({
      where: {
        serverId,
      },
    });
  }

  /**
   * Adds a channel to the guild channel allowlist.
   *
   * @param channel The Discord guild channel to allow.
   * @returns The created channel row.
   */
  async addChannel(channel: GuildChannel) {
    const lang = await LanguageApi.getLanguage(channel.guildId, this);
    if (await this.isAllowedChannel(channel)) {
      throw lang.obj["settings_channels_add_already_allowed"].replace(
        "{channel}",
        `<#${channel.id}>`,
      );
    } else {
      return this.Channel.create({
        serverId: channel.guildId,
        channelId: channel.id,
      });
    }
  }

  /**
   * Removes a channel from the guild channel allowlist.
   *
   * @param channel The Discord guild channel to remove.
   * @returns The number of removed rows.
   */
  async removeChannel(channel: GuildChannel): Promise<number> {
    const lang = await LanguageApi.getLanguage(channel.guildId, this);
    if (!(await this.isAllowedChannel(channel))) {
      throw lang.obj["settings_channels_remove_not_allowed"].replace(
        "{channel}",
        `<#${channel.id}>`,
      );
    } else {
      return await this.Channel.destroy({
        where: {
          serverId: channel.guildId,
          channelId: channel.id,
        },
      });
    }
  }

  /**
   * Lists all channel allowlist entries for a guild.
   *
   * @param serverId The Discord guild id.
   * @returns All stored channel rows for the guild.
   */
  async listChannels(serverId: string) {
    return await this.Channel.findAll({
      where: {
        serverId,
      },
    });
  }

  /**
   * Checks whether a channel is explicitly allowed for bot commands.
   *
   * @param channel The Discord guild channel to inspect.
   * @returns True when the channel is in the allowlist.
   */
  async isAllowedChannel(channel: GuildChannel): Promise<boolean> {
    return (
      (await this.Channel.count({
        where: {
          serverId: channel.guildId,
          channelId: channel.id,
        },
      })) > 0
    );
  }

  /**
   * Checks whether a guild has any channel allowlist entries.
   *
   * @param serverId The Discord guild id.
   * @returns True when at least one channel is configured.
   */
  async isAnyAllowedChannel(serverId: string): Promise<boolean> {
    return (
      (await this.Channel.count({
        where: {
          serverId,
        },
      })) > 0
    );
  }

  /**
   * Removes every channel allowlist entry for a guild.
   *
   * @param serverId The Discord guild id.
   * @returns The number of removed rows.
   */
  async resetChannels(serverId: string): Promise<number> {
    return await this.Channel.destroy({
      where: {
        serverId,
      },
    });
  }

  /**
   * Sets or updates the preferred language for a guild.
   *
   * @param serverId The Discord guild id.
   * @param languageCode The language code matching a language JSON file.
   * @returns The created row or Sequelize update result.
   */
  async setLanguage(serverId: string, languageCode: string) {
    const lang = await LanguageApi.getLanguage(serverId, this);
    if (await this.isLanguageSet(serverId, languageCode)) {
      throw lang.obj["settings_language_set_already_set"].replace(
        "{language}",
        languageCode,
      );
    } else if (await this.isAnyLanguageSet(serverId)) {
      // Language is stored as one row per guild, so changing it updates the
      // existing row instead of creating duplicates.
      return await this.Language.update(
        { languageCode },
        {
          where: {
            serverId,
          },
        },
      );
    } else {
      return this.Language.create({
        serverId,
        languageCode,
      });
    }
  }

  /**
   * Removes a guild's preferred language so it falls back to the default.
   *
   * @param serverId The Discord guild id.
   * @returns The number of removed rows.
   */
  async unsetLanguage(serverId: string): Promise<number> {
    const lang = await LanguageApi.getLanguage(serverId, this);
    if (await this.isAnyLanguageSet(serverId)) {
      return await this.Language.destroy({
        where: {
          serverId,
        },
      });
    } else {
      throw lang.obj["settings_language_unset_not_set"];
    }
  }

  /**
   * Checks whether a guild is already configured for a specific language.
   *
   * @param serverId The Discord guild id.
   * @param languageCode The language code to compare.
   * @returns True when that exact language is configured.
   */
  async isLanguageSet(
    serverId: string,
    languageCode: string,
  ): Promise<boolean> {
    return (
      (await this.Language.count({
        where: {
          serverId,
          languageCode,
        },
      })) > 0
    );
  }

  /**
   * Checks whether a guild has any preferred language configured.
   *
   * @param serverId The Discord guild id.
   * @returns True when a language row exists.
   */
  async isAnyLanguageSet(serverId: string): Promise<boolean> {
    return (
      (await this.Language.count({
        where: {
          serverId,
        },
      })) > 0
    );
  }

  /**
   * Gets the language code configured for a guild.
   *
   * @param serverId The Discord guild id.
   * @returns The stored language code, or `en_US` when no setting exists.
   */
  async getLanguageCode(serverId: string): Promise<string> {
    const result = await this.Language.findAll({
      where: {
        serverId,
      },
    });
    if (result.length < 1) return "en_US";
    else return result[0].getDataValue("languageCode");
  }

  /**
   * Lists available language file names without their `.json` extensions.
   *
   * @returns Language codes discovered in the languages directory.
   */
  async getLanguages() {
    const filenames: string[] = [];
    for await (const dirEntry of Deno.readDir("./languages")) {
      filenames.push(
        dirEntry.name.substring(0, dirEntry.name.lastIndexOf(".")),
      );
    }
    return filenames;
  }

  /**
   * Loads a language JSON object by code.
   *
   * @param language The language code to load.
   * @returns The language string lookup object.
   */
  async getLanguageObject(language: string = "en_US") {
    const languageObj = await import(`./languages/${language}.json`, {
      with: { type: "json" },
    });
    return languageObj.default;
  }

  /**
   * Gets one user's score and rank within a guild.
   *
   * @param serverId The Discord guild id.
   * @param userId The Discord user id.
   * @returns The ranked score entry, or null when the user has no score.
   */
  async getScore(
    serverId: string,
    userId: string,
  ): Promise<
    {
      position: number;
      serverId: string;
      userId: string;
      score: number;
    } | null
  > {
    const scores = await this.Score.findAll({
      where: {
        serverId,
      },
      order: [["score", "DESC"]],
    });
    for (let i = 0; i < scores.length; i++) {
      if (scores[i].getDataValue("userId") == userId) {
        return {
          position: i + 1,
          serverId,
          userId,
          score: scores[i].getDataValue("score"),
        };
      }
    }
    return null;
  }

  /**
   * Lists all scores for a guild from highest to lowest.
   *
   * @param serverId The Discord guild id.
   * @returns Score rows ordered descending by score.
   */
  async getScores(serverId: string) {
    return await this.Score.findAll({
      where: {
        serverId,
      },
      order: [["score", "DESC"]],
    });
  }

  /**
   * Sets a user's score, creating the row if necessary.
   *
   * @param serverId The Discord guild id.
   * @param userId The Discord user id.
   * @param score The score value to store.
   * @returns The created row or Sequelize update result.
   */
  async setScore(serverId: string, userId: string, score: number) {
    const found = await this.Score.count({
      where: {
        serverId,
        userId,
      },
    });
    if (found > 0) {
      return await this.Score.update(
        {
          score,
        },
        {
          where: {
            serverId,
            userId,
          },
        },
      );
    } else {
      return await this.Score.create({
        serverId,
        userId,
        score,
      });
    }
  }

  /**
   * Adds a positive amount to a user's score.
   *
   * @param serverId The Discord guild id.
   * @param userId The Discord user id.
   * @param score The positive score amount to add.
   * @returns The created row or Sequelize update result.
   */
  async addScore(serverId: string, userId: string, score: number) {
    const lang = await LanguageApi.getLanguage(serverId, this);
    const current = await this.Score.findOne({
      where: {
        serverId,
        userId,
      },
    });
    if (current) {
      if (score > 0) {
        return await this.Score.update(
          {
            score: current.getDataValue("score") + score,
          },
          {
            where: {
              serverId,
              userId,
            },
          },
        );
      } else {
        throw lang.obj["mod_score_add_lower_than_1"];
      }
    } else {
      if (score > 0) {
        return this.Score.create({
          serverId,
          userId,
          score,
        });
      } else {
        throw lang.obj["mod_score_add_lower_than_1"];
      }
    }
  }

  /**
   * Removes score from a user, clearing the row if the subtraction would go below zero.
   *
   * @param serverId The Discord guild id.
   * @param userId The Discord user id.
   * @param score The score amount to remove.
   * @returns The number of removed rows or Sequelize update result.
   */
  async removeScore(
    serverId: string,
    userId: string,
    score: number,
  ): Promise<number | [affectedCount: number]> {
    const current = await this.Score.findOne({
      where: {
        serverId,
        userId,
      },
    });
    if (current) {
      if (score > 0 && current.getDataValue("score") - score >= 0) {
        return await this.Score.update(
          {
            score: current.getDataValue("score") - score,
          },
          {
            where: {
              serverId,
              userId,
            },
          },
        );
      } else {
        return this.unsetScore(serverId, userId);
      }
    } else {
      return this.unsetScore(serverId, userId);
    }
  }

  /**
   * Deletes a user's score row.
   *
   * @param serverId The Discord guild id.
   * @param userId The Discord user id.
   * @returns The number of removed rows.
   */
  async unsetScore(serverId: string, userId: string): Promise<number> {
    const lang = await LanguageApi.getLanguage(serverId, this);
    const found = await this.Score.count({
      where: {
        serverId,
        userId,
      },
    });
    if (found > 0) {
      return this.Score.destroy({
        where: {
          serverId,
          userId,
        },
      });
    } else {
      throw lang.obj["mod_score_unset_not_set"];
    }
  }

  /**
   * Clears active encounter names for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns The number of removed encounter rows.
   */
  async clearEncounters(serverId: string, channelId: string): Promise<number> {
    return await this.Encounter.destroy({
      where: {
        serverId,
        channelId,
      },
    });
  }

  /**
   * Adds an accepted answer for the active encounter in a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @param name The accepted Pokemon name or id.
   * @param language The language code associated with the answer.
   * @returns The created encounter row.
   */
  async addEncounter(
    serverId: string,
    channelId: string,
    name: string,
    language: string,
  ) {
    return await this.Encounter.create({
      serverId,
      channelId,
      name,
      language,
    });
  }

  /**
   * Reads all accepted answers for the active encounter in a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns Encounter rows for the channel.
   */
  async getEncounter(serverId: string, channelId: string) {
    return await this.Encounter.findAll({
      where: {
        serverId,
        channelId,
      },
    });
  }

  /**
   * Checks whether reveal artwork is stored for a guild channel encounter.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns True when artwork exists.
   */
  async artworkExists(serverId: string, channelId: string): Promise<boolean> {
    return (
      (await this.Artwork.count({
        where: {
          serverId,
          channelId,
        },
      })) > 0
    );
  }

  /**
   * Gets reveal artwork for a guild channel encounter.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns The artwork URL, or null when none is stored.
   */
  async getArtwork(
    serverId: string,
    channelId: string,
  ): Promise<string | null> {
    return (
      await this.Artwork.findOne({
        where: {
          serverId,
          channelId,
        },
      })
    )?.getDataValue("url");
  }

  /**
   * Sets reveal artwork for a guild channel encounter.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @param url The artwork URL to store.
   * @returns The created row or Sequelize update result.
   */
  async setArtwork(serverId: string, channelId: string, url: string) {
    if (await this.artworkExists(serverId, channelId)) {
      return await this.Artwork.update(
        {
          url,
        },
        {
          where: {
            serverId,
            channelId,
          },
        },
      );
    } else {
      return await this.Artwork.create({
        serverId,
        channelId,
        url,
      });
    }
  }

  /**
   * Removes stored reveal artwork for a guild channel encounter.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns The number of removed rows, or null when no artwork existed.
   */
  async unsetArtwork(
    serverId: string,
    channelId: string,
  ): Promise<number | null> {
    if (await this.artworkExists(serverId, channelId)) {
      return await this.Artwork.destroy({
        where: {
          serverId,
          channelId,
        },
      });
    } else {
      return null;
    }
  }

  /**
   * Checks whether an explore timestamp is stored for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns True when a timestamp exists.
   */
  async lastExploreExists(
    serverId: string,
    channelId: string,
  ): Promise<boolean> {
    return (
      (await this.LastExplore.count({
        where: {
          serverId,
          channelId,
        },
      })) > 0
    );
  }

  /**
   * Gets the last explore timestamp for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns The timestamp in milliseconds, or null when none is stored.
   */
  async getLastExplore(
    serverId: string,
    channelId: string,
  ): Promise<number | null> {
    return (
      await this.LastExplore.findOne({
        where: {
          serverId,
          channelId,
        },
      })
    )?.getDataValue("time");
  }

  /**
   * Sets the last explore timestamp for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @param time The timestamp in milliseconds.
   * @returns The created row or Sequelize update result.
   */
  async setLastExplore(serverId: string, channelId: string, time: number) {
    if (await this.lastExploreExists(serverId, channelId)) {
      return await this.LastExplore.update(
        {
          time,
        },
        {
          where: {
            serverId,
            channelId,
          },
        },
      );
    } else {
      return await this.LastExplore.create({
        serverId,
        channelId,
        time,
      });
    }
  }

  /**
   * Removes the last explore timestamp for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns The number of removed rows, or null when none existed.
   */
  async unsetLastExplore(
    serverId: string,
    channelId: string,
  ): Promise<number | null> {
    if (await this.lastExploreExists(serverId, channelId)) {
      return await this.LastExplore.destroy({
        where: {
          serverId,
          channelId,
        },
      });
    } else {
      return null;
    }
  }

  /**
   * Checks whether a lightning round is active for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns True when lightning loop state exists.
   */
  async lightningExists(serverId: string, channelId: string): Promise<boolean> {
    return (
      (await this.Lightning.count({
        where: {
          serverId,
          channelId,
        },
      })) > 0
    );
  }

  /**
   * Gets the remaining lightning loop count for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns The remaining loop count, or null when no round is active.
   */
  async getLightningLoops(
    serverId: string,
    channelId: string,
  ): Promise<number | null> {
    return (
      await this.Lightning.findOne({
        where: {
          serverId,
          channelId,
        },
      })
    )?.getDataValue("loops");
  }

  /**
   * Sets the remaining lightning loop count for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @param loops The remaining follow-up encounters to run.
   * @returns The created row or Sequelize update result.
   */
  async setLightningLoops(serverId: string, channelId: string, loops: number) {
    if (await this.lightningExists(serverId, channelId)) {
      return await this.Lightning.update(
        {
          loops,
        },
        {
          where: {
            serverId,
            channelId,
          },
        },
      );
    } else {
      return await this.Lightning.create({
        serverId,
        channelId,
        loops,
      });
    }
  }

  /**
   * Clears lightning state for a guild channel.
   *
   * @param serverId The Discord guild id.
   * @param channelId The Discord channel id.
   * @returns The number of removed rows, or null when no round was active.
   */
  async unsetLightningLoops(
    serverId: string,
    channelId: string,
  ): Promise<number | null> {
    if (await this.lightningExists(serverId, channelId)) {
      return await this.Lightning.destroy({
        where: {
          serverId,
          channelId,
        },
      });
    } else {
      return null;
    }
  }

  /**
   * Closes the Sequelize database connection.
   *
   * @returns A promise that resolves after the connection is closed.
   */
  async disconnect() {
    return await this.db.close();
  }
}
