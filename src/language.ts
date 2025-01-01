import Database from "./data/postgres.ts";

export default class Language {
  static async getLanguage(
    guildId: string,
    db: Database,
  ): Promise<{ code: string; obj: { [key: string]: string } }> {
    const languageCode = await db.getLanguageCode(guildId);
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
