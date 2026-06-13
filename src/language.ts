/**
 * Loads a guild's configured localization file and exposes it with its language
 * code for command handlers and embed helpers.
 */
import Database from "./data/postgres.ts";

export default class Language {
  /**
   * Loads the localized string table selected for a guild.
   *
   * @param guildId The Discord guild id whose language setting should be used.
   * @param db The database used to read the guild language code.
   * @returns The selected language code and its string lookup object.
   */
  static async getLanguage(
    guildId: string,
    db: Database,
  ): Promise<{ code: string; obj: { [key: string]: string } }> {
    const languageCode = await db.getLanguageCode(guildId);
    // Dynamic import keeps language JSON files out of the hot path until a guild
    // actually requests the corresponding localization.
    const language: { [key: string]: string } = (await import(
      `./languages/${languageCode}.json`,
      { with: { type: "json" } }
    )).default;
    return {
      code: languageCode,
      obj: language,
    };
  }
}
