import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  AttachmentBuilder,
  SlashCommandBuilder,
} from "discord.js";
import Database from "./data/postgres";
import Language from "./language";
import Util from "./util";
import enLocalizations from "./languages/slash-commands/en.json";
import deLocalizations from "./languages/slash-commands/de.json";

export default class Explore {
  static async explore(
    interaction: ChatInputCommandInteraction,
    db: Database,
    preventDefer: boolean = false,
  ) {
    if (!preventDefer) await interaction.deferReply({ ephemeral: false }); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    let isMod = false;
    if (await db.isMod(interaction.member as GuildMember | null)) {
      isMod = true;
    } else {
      if (interaction.member) {
        let member = interaction.member as GuildMember;
        for (let [, /*roleId*/ role] of member.roles.cache) {
          if (await db.isMod(role)) {
            isMod = true;
            break;
          }
        }
      }
    }
    if (isMod) {
      console.log("Generating a new Pokemon");
      await db.clearEncounters(interaction.guildId!, interaction.channelId);
      await db.unsetArtwork(interaction.guildId!, interaction.channelId);
      let pokemon = await Util.generatePokemon();
      await db.addEncounter(
        interaction.guildId!,
        interaction.channelId,
        pokemon.url.replace(/.+\/(\d+)\//g, "$1"),
        "id",
      );
      let names = await Util.fetchNames(
        pokemon.url.replace(/.+\/(\d+)\//g, "$1"),
      );
      if (!names) {
        console.log(
          `Warning: 404 Not Found for pokemon ${pokemon.url.replace(
            /.+\/(\d+)\//g,
            "$1",
          )}. Fetching new pokemon.`,
        );
        this.explore(interaction, db, true); // Attention: Recursive
        return;
      }
      for (let name of names) {
        // Sets current pokemon (different languages) names in database
        console.log(
          `Guild: ${interaction.guildId}, Channel: ${interaction.channelId}, Name: ${name.name}, Language: ${name.languageName}`,
        );
        await db.addEncounter(
          interaction.guildId!,
          interaction.channelId,
          name.name,
          name.languageName,
        );
      }
      // Gets sprite url for the reply to the command with the newly generated pokemon
      let sprites = await Util.fetchSprite(pokemon.url);
      let spriteUrl = sprites.front_default;
      if (!spriteUrl) {
        console.log(
          `Warning: front_default sprite for ${pokemon.name} is null. Fetching new pokemon.`,
        );
        this.explore(interaction, db, true); // Attention: Recursive
        return;
      }
      let officialArtUrl = sprites.other.official_artwork.front_default;
      console.log(spriteUrl);
      console.log(officialArtUrl);
      await db.setArtwork(
        interaction.guildId!,
        interaction.channelId,
        officialArtUrl,
      );
      let returnedEmbed: {
        embed: EmbedBuilder;
        attachment: AttachmentBuilder | null;
      } = Util.returnEmbed(
        lang.obj["explore_wild_pokemon_appeared_title"],
        lang.obj["explore_wild_pokemon_appeared_description"],
        lang,
        0x00ae86,
        spriteUrl,
      );
      let actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("catchBtn")
          .setLabel(lang.obj["catch_this_pokemon"])
          .setStyle(ButtonStyle.Primary),
      );
      if (returnedEmbed.attachment == null)
        await interaction.editReply({
          embeds: [returnedEmbed.embed],
          components: [actionRow],
        });
      else
        await interaction.editReply({
          embeds: [returnedEmbed.embed],
          files: [returnedEmbed.attachment],
          components: [actionRow],
        });
      await db.setLastExplore(
        interaction.guildId!,
        interaction.channelId,
        Date.now(),
      );
    } else {
      Util.editReply(
        interaction,
        lang.obj["explore_no_mod_title"],
        lang.obj["explore_no_mod_description"],
        lang,
      );
    }
  }

  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName(enLocalizations.explore_name)
      .setNameLocalizations({
        de: deLocalizations.explore_name,
      })
      .setDescription(enLocalizations.explore_description)
      .setDescriptionLocalizations({
        de: deLocalizations.explore_description,
      });
  }
}
