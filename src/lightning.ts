/**
 * Implements `/lightning`, a chained encounter mode that starts another Pokemon
 * after each successful catch until the configured loop count is exhausted.
 */
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
  SlashCommandBuilder,
} from "discord.js";
import Database from "./data/postgres.ts";
import Language from "./language.ts";
import Util from "./util.ts";
import Explore from "./explore.ts";
import enLocalizations from "./languages/slash-commands/en.json" with {
  type: "json",
};
import deLocalizations from "./languages/slash-commands/de.json" with {
  type: "json",
};

export default class Lightning {
  /**
   * Starts a lightning round and immediately posts its first encounter.
   *
   * @param interaction The Discord slash-command interaction.
   * @param db The database used to persist remaining lightning loops.
   * @param preventDefer Set true when the interaction was already deferred.
   * @returns A promise that resolves after the first encounter is posted.
   */
  static async lightning(
    interaction: ChatInputCommandInteraction,
    db: Database,
    preventDefer: boolean = false,
  ) {
    const loops = interaction.options.getInteger("loops")!;
    const remainingLoops = loops - 1;

    console.log(
      `Lightning round started: guild=${interaction.guildId}, channel=${interaction.channelId}, loops=${loops}, remainingLoops=${remainingLoops}`,
    );

    // TODO: I should check permissions / isMod here, but I cannot be arsed currently.
    await db.setLightningLoops(
      interaction.guildId!,
      interaction.channelId!,
      remainingLoops,
    );
    await Explore.explore(interaction, db, preventDefer);
  }

  /**
   * Continues or ends an active lightning round after an encounter is resolved.
   *
   * @param interaction The interaction from the catch or reveal flow.
   * @param db The database used to read and update remaining loops.
   * @returns A promise that resolves after lightning state is updated.
   */
  static async checkLightning(
    interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
    db: Database,
  ) {
    let loops = await db.getLightningLoops(
      interaction.guildId!,
      interaction.channelId!,
    );
    if (loops) {
      console.log(
        `Lightning round continuing: guild=${interaction.guildId}, channel=${interaction.channelId}, loopsRemainingBefore=${loops}`,
      );

      // Generate the next encounter before decrementing so the stored loop count
      // tracks the number of follow-up encounters still available.
      await Lightning.explore(interaction, db, true);

      loops -= 1;
      if (loops > 0) {
        await db.setLightningLoops(
          interaction.guildId!,
          interaction.channelId!,
          loops,
        );

        console.log(
          `Lightning round loops remaining: guild=${interaction.guildId}, channel=${interaction.channelId}, loopsRemaining=${loops}`,
        );
      } else {
        await db.unsetLightningLoops(
          interaction.guildId!,
          interaction.channelId!,
        );

        console.log(
          `Lightning round ended: guild=${interaction.guildId}, channel=${interaction.channelId}`,
        );
      }
    }
  }

  /**
   * Posts a lightning encounter without rechecking moderator permissions.
   *
   * @param interaction The command or modal interaction to reply from.
   * @param db The database used to store encounter names and artwork.
   * @param preventDefer Set true when the interaction was already deferred.
   * @returns A promise that resolves after the encounter follow-up is sent.
   */
  static async explore(
    interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
    db: Database,
    preventDefer: boolean = false,
  ) {
    if (!preventDefer) await interaction.deferReply(); // PokeBot is thinking
    const lang = await Language.getLanguage(interaction.guildId!, db);
    console.log("Generating a new Pokemon");
    await db.clearEncounters(interaction.guildId!, interaction.channelId!);
    await db.unsetArtwork(interaction.guildId!, interaction.channelId!);
    const pokemon = await Util.generatePokemon();
    // Store the numeric PokeAPI id as an acceptable guess in addition to all
    // localized species names fetched below.
    await db.addEncounter(
      interaction.guildId!,
      interaction.channelId!,
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
        interaction.channelId!,
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
      interaction.channelId!,
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
      await interaction.followUp({
        embeds: [returnedEmbed.embed],
        components: [actionRow],
      });
    } else {
      await interaction.followUp({
        embeds: [returnedEmbed.embed],
        files: [returnedEmbed.attachment],
        components: [actionRow],
      });
    }
    await db.setLastExplore(
      interaction.guildId!,
      interaction.channelId!,
      Date.now(),
    );
  }

  /**
   * Builds the Discord slash-command definition for `/lightning`.
   *
   * @returns The localized slash-command builder.
   */
  static getRegisterObject() {
    return new SlashCommandBuilder()
      .setName(enLocalizations.lightning_name)
      .setNameLocalizations({
        de: deLocalizations.lightning_name,
      })
      .setDescription(enLocalizations.lightning_description)
      .setDescriptionLocalizations({
        de: deLocalizations.lightning_description,
      })
      .addSubcommand((subcommand) =>
        subcommand
          .setName(enLocalizations.lightning_start_name)
          .setNameLocalizations({
            de: deLocalizations.lightning_start_name,
          })
          .setDescription(enLocalizations.lightning_start_description)
          .setDescriptionLocalizations({
            de: deLocalizations.lightning_start_description,
          })
          .addIntegerOption((option) =>
            option
              .setName(enLocalizations.lightning_start_loops_name)
              .setNameLocalizations({
                de: deLocalizations.lightning_start_loops_name,
              })
              .setDescription(enLocalizations.lightning_start_loops_description)
              .setDescriptionLocalizations({
                de: deLocalizations.lightning_start_loops_description,
              })
              .setRequired(true)
          )
      );
  }
}
