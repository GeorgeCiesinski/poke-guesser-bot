import Database from "./data/postgres";

export default class Language {
  static async getLanguage(
    guildId: string,
    db: Database
  ): Promise<{ code: string; obj: { [key: string]: string } }> {
    let languageCode = await db.getLanguageCode(guildId);
    let language: { [key: string]: string } = await import(
      `./languages/${languageCode}.json`
    );
    return {
      code: languageCode,
      obj: language,
    };
  }
}
