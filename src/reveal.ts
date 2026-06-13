/**
 * Implements `/reveal`, allowing moderators to end the current encounter and
 * show the correct Pokemon names.
 */
import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import Database from "./data/postgres.ts";
import Lightning from "./lightning.ts";
import Language from "./language.ts";
import Util from "./util.ts";
import enLocalizations from "./languages/slash-commands/en.json" with {
  type: "json",
};
import deLocalizations from "./languages/slash-commands/de.json" with {
  type: "json",
};

export default class Reveal {
  /**
   * Reveals the active encounter's answer when invoked by a configured moderator.
   *
   * @param interaction The Discord slash-command interaction.
   * @param db The database used to read and clear the active encounter.
   * @returns A promise that resolves after the reveal reply is edited.
   */
  static async reveal(interaction: ChatInputCommandInteraction, db: Database) {
    await interaction.deferReply(); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    let isMod = false;
    // Moderation can be granted directly to a user or indirectly through any of
    // their roles, so both paths must be checked before revealing an answer.
    if (await db.isMod(interaction.member as GuildMember | null)) {
      isMod = true;
    } else {
      if (interaction.member) {
        const member = interaction.member as GuildMember;
        for (const [, role] of member.roles.cache) {
          if (await db.isMod(role)) {
            isMod = true;
            break;
          }
        }
      }
    }
    if (!isMod) {
      await Util.editReply(
        interaction,
        lang.obj["reveal_no_mod_title"],
        lang.obj["reveal_no_mod_description"],
        lang,
      );
      return;
    }
    const encounter = await db.getEncounter(
      interaction.guildId!,
      interaction.channelId,
    );
    if (encounter.length > 0) {
      const pokemonNames: string[] = [];
      let englishIndex = 0;
      // De-duplicate localized names so repeated language variants do not make
      // the reveal message noisy.
      for (let i = 0; i < encounter.length; i++) {
        encounter[i].name = encounter[i].getDataValue("name");
        encounter[i].language = encounter[i].getDataValue("language");
        if (!encounter[i].name) continue;
        const lowercaseName = encounter[i].name?.toLowerCase();
        if (!pokemonNames.includes(lowercaseName ?? "")) {
          pokemonNames.push(lowercaseName ?? "");
        }
        if (encounter[i].language === "en") englishIndex = i;
      }
      // Build the optional parenthesized list of non-English accepted answers.
      let inBrackets = "";
      for (let i = 0; i < pokemonNames.length; i++) {
        if (i == englishIndex) continue;
        if (inBrackets == "") inBrackets = Util.capitalize(pokemonNames[i]);
        else inBrackets += `, ${Util.capitalize(pokemonNames[i])}`;
      }
      console.log(
        `Mod requested reveal: ${encounter[englishIndex].name} (${inBrackets})`,
      );
      await Util.editReply(
        interaction,
        lang.obj["reveal_pokemon_escaped_title"],
        lang.obj["reveal_pokemon_escaped_description"]
          .replace(
            "<englishPokemon>",
            encounter[englishIndex].name
              ? Util.capitalize(encounter[englishIndex].name!)
              : "N/A",
          )
          .replace("<inBrackets>", inBrackets),
        lang,
      );
      await db.clearEncounters(interaction.guildId!, interaction.channelId);
      await Lightning.checkLightning(interaction, db);
    } else {
      await Util.editReply(
        interaction,
        lang.obj["reveal_no_encounter_title"],
        lang.obj["reveal_no_encounter_description"],
        lang,
      );
    }
  }

  /**
   * Builds the Discord slash-command definition for `/reveal`.
   *
   * @returns The localized slash-command builder.
   */
  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName(enLocalizations.reveal_name)
      .setNameLocalizations({
        de: deLocalizations.reveal_name,
      })
      .setDescription(enLocalizations.reveal_description)
      .setDescriptionLocalizations({
        de: deLocalizations.reveal_description,
      });
  }
}
