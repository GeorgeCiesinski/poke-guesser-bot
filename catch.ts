import {
  AttachmentBuilder,
  ButtonInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
} from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from "./util";

export default class Catch {
  private static guessEntered: boolean = false;

  static async catchModalSubmitted(
    btnInteraction: ButtonInteraction,
    modalInteraction: ModalSubmitInteraction,
    db: Database
  ) {
    await modalInteraction.deferUpdate(); // PokeBot is thinking
    Catch.guessEntered = true;
    const guess = modalInteraction.fields.getTextInputValue("guess");
    console.log(`${modalInteraction.user.tag} guessed ${guess}`);
    if (
      (modalInteraction.guild && !modalInteraction.guild.available) ||
      !modalInteraction.guild
    )
      return;
    const lang = await Language.getLanguage(modalInteraction.guild.id, db);
    // TODO: Disadvantages like delay and timeout
    let encounter = await db.getEncounter(
      modalInteraction.guild.id,
      btnInteraction.channelId
    );
    if (encounter.length > 0) {
      let guessed = false;
      // Loop through pokemon names and check against guess
      for (let i = 0; i < encounter.length; i++) {
        if (
          encounter[i].getDataValue("name").toLowerCase() ===
          guess.toLowerCase()
        ) {
          await db.clearEncounters(
            modalInteraction.guild.id,
            btnInteraction.channelId
          );
          let artwork = await db.getArtwork(
            modalInteraction.guild.id,
            btnInteraction.channelId
          );
          await db.addScore(
            modalInteraction.guild.id,
            btnInteraction.user.id,
            1
          );
          let englishIndex = 0;
          for (let j = 0; j < encounter.length; j++) {
            if (encounter[j].getDataValue("language") === "en")
              englishIndex = j;
          }
          // Send messsage that guess is correct
          let title = "";
          if (
            encounter[i].getDataValue("name").toLowerCase() ===
            encounter[englishIndex].getDataValue("name").toLowerCase()
          )
            title = lang.obj["catch_caught_english_title"].replace(
              "<pokemon>",
              Util.capitalize(encounter[englishIndex].getDataValue("name"))
            );
          else
            title = lang.obj["catch_caught_other_language_title"]
              .replace(
                "<englishPokemon>",
                Util.capitalize(encounter[englishIndex].getDataValue("name"))
              )
              .replace(
                "<guessedPokemon>",
                Util.capitalize(encounter[i].getDataValue("name"))
              );
          console.log(`catch.js-artwork: ${artwork}`);
          let returnedEmbed: {
            embed: EmbedBuilder;
            attachment: AttachmentBuilder | null;
          } = Util.returnEmbed(
            title,
            lang.obj["catch_caught_description"].replace(
              "<guesser>",
              `<@${btnInteraction.user.id}>`
            ),
            lang,
            0x00ae86,
            artwork
          );
          if (returnedEmbed.attachment == null)
            await btnInteraction.followUp({
              embeds: [returnedEmbed.embed],
              ephemeral: false,
            });
          else
            await btnInteraction.followUp({
              embeds: [returnedEmbed.embed],
              files: [returnedEmbed.attachment],
              ephemeral: false,
            });
          guessed = true;
          await db.unsetArtwork(
            modalInteraction.guild.id,
            btnInteraction.channelId
          );
          this.guessEntered = false; // Reset guessEntered
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
              lang
            ).embed,
          ],
          ephemeral: true,
        });
      }
    } else {
      // returnEmbed(title, message, image=null)
      await btnInteraction.followUp({
        embeds: [
          Util.returnEmbed(
            lang.obj["catch_no_encounter_title"],
            lang.obj["catch_no_encounter_description"],
            lang
          ).embed,
        ],
        ephemeral: true,
      });
      this.guessEntered = false; // Reset guessEntered
    }
    return false;
  }
}
