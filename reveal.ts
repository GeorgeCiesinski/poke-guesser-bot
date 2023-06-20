import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from "./util";

export default class Reveal {
  static async reveal(interaction: ChatInputCommandInteraction, db: Database) {
    if (!interaction.guild?.available) {
      await interaction.reply({
        content:
          "Guild not available  (reveal -> reveal -> interaction.guild.available is either null or false)",
        ephemeral: true,
      });
      return;
    }
    if (!interaction.guildId) {
      await interaction.reply({
        content:
          "Internal Server Error (reveal -> reveal -> interaction.guildId = null)",
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply({ ephemeral: false }); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId, db);
    if (await db.isMod(interaction.member as GuildMember | null)) {
      console.log("isMod: true");
      let encounter = await db.getEncounter(
        interaction.guildId,
        interaction.channelId
      );
      if (encounter.length > 0) {
        let pokemonNames: string[] = [];
        let englishIndex = 0;
        for (let i = 0; i < encounter.length; i++) {
          // console.log(encounter)
          let lowercaseName = encounter[i].name.toLowerCase();
          if (!pokemonNames.includes(lowercaseName))
            pokemonNames.push(lowercaseName);
          if (encounter[i].language === "en") englishIndex = i;
        }
        // build string to put in between brackets
        let inBrackets = "";
        for (let i = 0; i < pokemonNames.length; i++) {
          if ((inBrackets = "")) inBrackets = Util.capitalize(pokemonNames[i]);
          else inBrackets += `, ${Util.capitalize(pokemonNames[i])}`;
        }
        console.log(
          `Mod requested reveal: ${encounter[englishIndex].name} (${inBrackets})`
        );
        // returnEmbed(title, message, image=null)
        await Util.editReply(
          interaction,
          lang.obj["reveal_pokemon_escaped_title"],
          lang.obj["reveal_pokemon_escaped_description"]
            .replace(
              "<englishPokemon>",
              Util.capitalize(encounter[englishIndex].name)
            )
            .replace("<inBrackets>", inBrackets),
          lang
        );
        await db.clearEncounters(interaction.guildId, interaction.channelId);
      } else {
        // returnEmbed(title, message, image=null)
        await Util.editReply(
          interaction,
          lang.obj["reveal_no_encounter_title"],
          lang.obj["reveal_no_encounter_description"],
          lang
        );
      }
    } else {
      // returnEmbed(title, message, image=null)
      await Util.editReply(
        interaction,
        lang.obj["reveal_no_mod_title"],
        lang.obj["reveal_no_mod_description"],
        lang
      );
    }
  }

  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName("reveal")
      .setNameLocalizations({
        de: "aufloesen",
      })
      .setDescription("Reveals the current pokemon")
      .setDescriptionLocalizations({
        de: "Löst das aktuell gesuchte Pokemon auf",
      });
  }
}
