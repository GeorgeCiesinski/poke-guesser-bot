import { DataTypes, Model, Sequelize } from "sequelize";
import LanguageApi from "../language.ts";
import Util from "../util.ts";
import { GuildChannel, GuildMember, Role } from "discord.js";
// Discord-IDs are 18 chars atm (2021) but will increase in the future

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

  constructor() {
    if (
      Deno.env.has("DATABASE_URL") && Deno.env.get("DATABASE_URL")!.trim() != ""
    ) {
      this.db = new Sequelize(Deno.env.get("DATABASE_URL")!, {
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

  async connect(): Promise<void> {
    return await this.db.authenticate();
  }

  async prepareDb(): Promise<Sequelize> {
    return await this.db.sync({ alter: true });
  }

  async getUsernameMode(serverId: string) {
    return await this.Username.findOne({
      where: {
        serverId,
      },
    });
  }

  /**
   * 0 = Nickname if exists -> Display Name if exists -> Username in any other case
   * 1 = Nickname if exists -> Username in any other case
   * 2 = Display Name if exists -> Username in any other case
   * 3 = Display Name if exists -> Nickname if exists -> Username in any other case
   * 4 = Always Username
   */
  async setUsernameMode(serverId: string, mode: number) {
    if (mode < 0 || mode > 4) throw new Error("mode must be between 0 and 4");
    const oldMode = await this.getUsernameMode(serverId);
    if (oldMode == null || oldMode == undefined) {
      return await this.Username.create({ serverId, mode });
    } else {
      return await this.Username.update({ mode }, { where: { serverId } });
    }
  }

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

  async listMods(serverId: string) {
    return await this.Mod.findAll({
      where: {
        serverId,
      },
    });
  }

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

  async resetMods(serverId: string): Promise<number> {
    return await this.Mod.destroy({
      where: {
        serverId,
      },
    });
  }

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

  async listChannels(serverId: string) {
    return await this.Channel.findAll({
      where: {
        serverId,
      },
    });
  }

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

  async isAnyAllowedChannel(serverId: string): Promise<boolean> {
    return (
      (await this.Channel.count({
        where: {
          serverId,
        },
      })) > 0
    );
  }

  async resetChannels(serverId: string): Promise<number> {
    return await this.Channel.destroy({
      where: {
        serverId,
      },
    });
  }

  async setLanguage(serverId: string, languageCode: string) {
    const lang = await LanguageApi.getLanguage(serverId, this);
    if (await this.isLanguageSet(serverId, languageCode)) {
      throw lang.obj["settings_language_set_already_set"].replace(
        "{language}",
        languageCode,
      );
    } else if (await this.isAnyLanguageSet(serverId)) {
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

  async isAnyLanguageSet(serverId: string): Promise<boolean> {
    return (
      (await this.Language.count({
        where: {
          serverId,
        },
      })) > 0
    );
  }

  async getLanguageCode(serverId: string): Promise<string> {
    const result = await this.Language.findAll({
      where: {
        serverId,
      },
    });
    if (result.length < 1) return "en_US";
    else return result[0].getDataValue("languageCode");
  }

  async getLanguages() {
    const filenames: string[] = [];
    for await (const dirEntry of Deno.readDir("./languages")) {
      filenames.push(
        dirEntry.name.substring(0, dirEntry.name.lastIndexOf(".")),
      );
    }
    return filenames;
  }

  async getLanguageObject(language: string = "en_US") {
    const languageObj = await import(`./languages/${language}.json`, {
      with: { type: "json" },
    });
    return languageObj.default;
  }

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

  async getScores(serverId: string) {
    return await this.Score.findAll({
      where: {
        serverId,
      },
      order: [["score", "DESC"]],
    });
  }

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

  async clearEncounters(serverId: string, channelId: string): Promise<number> {
    return await this.Encounter.destroy({
      where: {
        serverId,
        channelId,
      },
    });
  }

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

  async getEncounter(serverId: string, channelId: string) {
    return await this.Encounter.findAll({
      where: {
        serverId,
        channelId,
      },
    });
  }

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

  async disconnect() {
    return await this.db.close();
  }
}
