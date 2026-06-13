/**
 * Implements `/explore`, which starts a new Pokemon encounter and posts the
 * catch button for players in the current channel.
 */
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import Database from "./data/postgres.ts";
import Language from "./language.ts";
import Util from "./util.ts";
import enLocalizations from "./languages/slash-commands/en.json" with {
  type: "json",
};
import deLocalizations from "./languages/slash-commands/de.json" with {
  type: "json",
};

export default class Explore {
  /**
   * Starts a new encounter when the user is a configured moderator.
   *
   * @param interaction The Discord slash-command interaction.
   * @param db The database used to store encounter names and artwork.
   * @param preventDefer Set true when called recursively after the reply was already deferred.
   * @returns A promise that resolves after the encounter reply is sent or denied.
   */
  static async explore(
    interaction: ChatInputCommandInteraction,
    db: Database,
    preventDefer: boolean = false,
  ) {
    if (!preventDefer) await interaction.deferReply(); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    let isMod = false;
    // Moderation can be granted directly to a user or indirectly through any of
    // their roles, so both paths must be checked before allowing encounter control.
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
    if (isMod) {
      console.log("Generating a new Pokemon");
      await db.clearEncounters(interaction.guildId!, interaction.channelId);
      await db.unsetArtwork(interaction.guildId!, interaction.channelId);
      const pokemon = await Util.generatePokemon();
      // Store the numeric PokeAPI id as an acceptable guess in addition to all
      // localized species names fetched below.
      await db.addEncounter(
        interaction.guildId!,
        interaction.channelId,
        pokemon.url.replace(/.+\/(\d+)\//g, "$1"),
        "id",
      );
      const names = await Util.fetchNames(
        pokemon.url.replace(/.+\/(\d+)\//g, "$1"),
      );
      if (!names) {
        console.log(
          `Warning: 404 Not Found for pokemon ${
            pokemon.url.replace(
              /.+\/(\d+)\//g,
              "$1",
            )
          }. Fetching new pokemon.`,
        );
        // Some random PokeAPI resources are forms without species names; retry
        // using the already-deferred interaction.
        this.explore(interaction, db, true);
        return;
      }
      for (const name of names) {
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
      const sprites = await Util.fetchSprite(pokemon.url);
      const spriteUrl = sprites.front_default;
      if (!spriteUrl) {
        console.log(
          `Warning: front_default sprite for ${pokemon.name} is null. Fetching new pokemon.`,
        );
        // Encounters need an image for the guessing prompt, so retry when a
        // randomly selected resource lacks a front sprite.
        this.explore(interaction, db, true);
        return;
      }
      const officialArtUrl = sprites.other.official_artwork.front_default;
      console.log(spriteUrl);
      console.log(officialArtUrl);
      await db.setArtwork(
        interaction.guildId!,
        interaction.channelId,
        officialArtUrl,
      );
      const returnedEmbed: {
        embed: EmbedBuilder;
        attachment: AttachmentBuilder | null;
      } = Util.returnEmbed(
        lang.obj["explore_wild_pokemon_appeared_title"],
        lang.obj["explore_wild_pokemon_appeared_description"],
        lang,
        0x00ae86,
        spriteUrl,
      );
      const actionRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId("catchBtn")
          .setLabel(lang.obj["catch_this_pokemon"])
          .setStyle(ButtonStyle.Primary),
      );
      if (returnedEmbed.attachment == null) {
        await interaction.editReply({
          embeds: [returnedEmbed.embed],
          components: [actionRow],
        });
      } else {
        await interaction.editReply({
          embeds: [returnedEmbed.embed],
          files: [returnedEmbed.attachment],
          components: [actionRow],
        });
      }
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

  /**
   * Builds the Discord slash-command definition for `/explore`.
   *
   * @returns The localized slash-command builder.
   */
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
