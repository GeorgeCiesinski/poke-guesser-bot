/**
 * Handles Pokemon catch modal submissions, validates guesses against active
 * encounters, awards score, and advances lightning rounds.
 */
import {
  AttachmentBuilder,
  ButtonInteraction,
  EmbedBuilder,
  MessageFlags,
  ModalSubmitInteraction,
} from "discord.js";
import Database from "./data/postgres.ts";
import Language from "./language.ts";
import Lightning from "./lightning.ts";
import Util from "./util.ts";

export default class Catch {
  private static guessEntered: boolean = false;

  /**
   * Processes a submitted catch guess for the encounter button that opened it.
   *
   * @param btnInteraction The button interaction that launched the catch modal.
   * @param modalInteraction The submitted modal containing the player's guess.
   * @param db The database used to read encounters, artwork, and scores.
   * @returns True when the guess was correct and the original button should be removed.
   */
  static async catchModalSubmitted(
    btnInteraction: ButtonInteraction,
    modalInteraction: ModalSubmitInteraction,
    db: Database,
  ) {
    await modalInteraction.deferUpdate(); // PokeBot is thinking
    Catch.guessEntered = true;
    const guess = modalInteraction.fields.getTextInputValue("guess");
    console.log(`${modalInteraction.user.tag} guessed ${guess}`);
    if (
      (modalInteraction.guild && !modalInteraction.guild.available) ||
      !modalInteraction.guild
    ) {
      return;
    }
    const lang = await Language.getLanguage(modalInteraction.guild.id, db);
    // TODO: Disadvantages like delay and timeout
    const encounter = await db.getEncounter(
      modalInteraction.guild.id,
      btnInteraction.channelId,
    );
    if (encounter.length > 0) {
      let guessed = false;
      // Each encounter stores the numeric id plus every localized species name;
      // any exact case-insensitive match counts as a successful catch.
      for (let i = 0; i < encounter.length; i++) {
        if (
          encounter[i].getDataValue("name").toLowerCase() ===
            guess.toLowerCase()
        ) {
          await db.clearEncounters(
            modalInteraction.guild.id,
            btnInteraction.channelId,
          );
          const artwork = await db.getArtwork(
            modalInteraction.guild.id,
            btnInteraction.channelId,
          );
          await db.addScore(
            modalInteraction.guild.id,
            btnInteraction.user.id,
            1,
          );
          let englishIndex = 0;
          // The success message always highlights the English name, then adds
          // the matched localized name when the player guessed another language.
          for (let j = 0; j < encounter.length; j++) {
            if (encounter[j].getDataValue("language") === "en") {
              englishIndex = j;
            }
          }
          let title = "";
          if (
            encounter[i].getDataValue("name").toLowerCase() ===
              encounter[englishIndex].getDataValue("name").toLowerCase()
          ) {
            title = lang.obj["catch_caught_english_title"].replace(
              "<pokemon>",
              Util.capitalize(encounter[englishIndex].getDataValue("name")),
            );
          } else {
            title = lang.obj["catch_caught_other_language_title"]
              .replace(
                "<englishPokemon>",
                Util.capitalize(encounter[englishIndex].getDataValue("name")),
              )
              .replace(
                "<guessedPokemon>",
                Util.capitalize(encounter[i].getDataValue("name")),
              );
          }
          console.log(`catch.js-artwork: ${artwork}`);
          const returnedEmbed: {
            embed: EmbedBuilder;
            attachment: AttachmentBuilder | null;
          } = Util.returnEmbed(
            title,
            lang.obj["catch_caught_description"].replace(
              "<guesser>",
              `<@${btnInteraction.user.id}>`,
            ),
            lang,
            0x00ae86,
            artwork,
          );
          if (returnedEmbed.attachment == null) {
            await btnInteraction.followUp({
              embeds: [returnedEmbed.embed],
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await btnInteraction.followUp({
              embeds: [returnedEmbed.embed],
              files: [returnedEmbed.attachment],
            });
          }
          guessed = true;
          await db.unsetArtwork(
            modalInteraction.guild.id,
            btnInteraction.channelId,
          );
          this.guessEntered = false; // Reset guessEntered
          await Lightning.checkLightning(modalInteraction, db);
          //break;
          return true;
        }
      }
      if (!guessed) {
        await btnInteraction.followUp({
          embeds: [
            Util.returnEmbed(
              lang.obj["catch_guess_incorrect_title"],
              lang.obj["catch_guess_incorrect_description"],
              lang,
            ).embed,
          ],
          flags: MessageFlags.Ephemeral,
        });
      }
    } else {
      await btnInteraction.followUp({
        embeds: [
          Util.returnEmbed(
            lang.obj["catch_no_encounter_title"],
            lang.obj["catch_no_encounter_description"],
            lang,
          ).embed,
        ],
        flags: MessageFlags.Ephemeral,
      });
      this.guessEntered = false; // Reset guessEntered
    }
    return false;
  }
}
