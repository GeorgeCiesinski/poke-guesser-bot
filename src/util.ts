/**
 * Provides shared helpers for Discord embeds, member lookups, PokeAPI access,
 * username display rules, and small filesystem checks.
 */
import {
  APIGuildMember,
  APIRole,
  AttachmentBuilder,
  BaseInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  Message,
  PermissionsBitField,
  Role,
  User,
} from "discord.js";

type FetchSpriteType = {
  back_default: string;
  back_female: string;
  back_shiny: string;
  back_shiny_female: string;
  front_default: string;
  front_female: string;
  front_shiny: string;
  front_shiny_female: string;
  other: {
    dream_world: {
      front_default: string;
      front_female: string;
    };
    home: {
      front_default: string;
      front_female: string;
      front_shiny: string;
      front_shiny_female: string;
    };
    official_artwork: {
      front_default: string;
    };
  };
};

export default class Util {
  /**
   * Creates a Poke Guesser themed Discord embed, optionally attaching an image.
   *
   * @param title The embed title.
   * @param description The embed body text.
   * @param language Localized strings used for shared embed chrome.
   * @param color The embed accent color.
   * @param image Optional local path or URL for an image attachment.
   * @returns The embed and, when an image was supplied, its attachment.
   */
  static returnEmbed(
    title: string,
    description: string,
    language: { code: string; obj: { [key: string]: string } },
    color: number = 0x00ae86,
    image: string | null = null,
  ): { embed: EmbedBuilder; attachment: AttachmentBuilder | null } {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        name: language.obj["embed_author_name"],
        iconURL: language.obj["embed_author_icon_url"],
        url: language.obj["embed_author_url"],
      })
      .setColor(color)
      .setDescription(description)
      .setThumbnail(language.obj["embed_thumbnail"])
      .setFooter({
        text: language.obj["credits_text"],
        iconURL: language.obj["credits_icon_url"],
      });
    if (image) {
      const attachment = new AttachmentBuilder(image, { name: "pokemon.png" });
      embed.setImage("attachment://pokemon.png");
      return {
        embed,
        attachment,
      };
    } else {
      return {
        embed,
        attachment: null,
      };
    }
  }

  /**
   * Normalizes a Pokemon name to leading-capital display text.
   *
   * @param str The Pokemon name or label to format.
   * @returns The input with the first letter uppercased and the rest lowercased.
   */
  static capitalize(str: string): string {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Fetches a guild member by user id using Discord's cache when possible.
   *
   * @param interaction The interaction whose guild should be searched.
   * @param id The Discord user id to fetch as a guild member.
   * @returns The guild member, or undefined when the user is not in the guild.
   */
  static async findMember(
    interaction: BaseInteraction,
    id: string,
  ): Promise<GuildMember | undefined> {
    // `force: false` avoids an API fetch when Discord.js already has the member cached.
    return await interaction.guild?.members.fetch({ user: id, force: false })
      .catch((_err) => undefined);
  }

  /**
   * Fetches a Discord user by id.
   *
   * @param interaction The interaction whose client should perform the lookup.
   * @param id The Discord user id to fetch.
   * @returns The fetched user.
   */
  static async findUser(
    interaction: BaseInteraction,
    id: string,
  ): Promise<User | undefined> {
    return await interaction.client.users.fetch(id, { force: false });
  }

  /**
   * Checks whether a member owns the guild or has Administrator permission.
   *
   * @param member The guild member to inspect.
   * @returns True when the member is a guild administrator.
   */
  static isAdmin(member: GuildMember): boolean {
    return (
      member.id == member.guild.ownerId ||
      member.permissions.has(PermissionsBitField.Flags.Administrator)
    );
  }

  /**
   * Checks whether a Discord mentionable value represents a user or member.
   *
   * @param mentionable The mentionable Discord object to inspect.
   * @returns True when the object is a user-like value.
   */
  static isUser(
    mentionable: User | GuildMember | APIGuildMember | Role | APIRole,
  ): boolean {
    return mentionable instanceof User || mentionable instanceof GuildMember;
  }

  /**
   * Checks whether a Discord mentionable value represents a role.
   *
   * @param mentionable The mentionable Discord object to inspect.
   * @returns True when the object is a role.
   */
  static isRole(
    mentionable: User | GuildMember | APIGuildMember | Role | APIRole,
  ): boolean {
    return mentionable instanceof Role;
  }

  /**
   * Selects a random Pokemon from PokeAPI's Pokemon endpoint.
   *
   * @returns The randomly selected Pokemon resource name and URL.
   */
  static async generatePokemon(): Promise<{ name: string; url: string }> {
    // The limit intentionally exceeds the current count so newly added Pokemon
    // are included without changing the code.
    const res: Response = await fetch(
      "https://pokeapi.co/api/v2/pokemon/?limit=2000",
    );
    const json = await res.json();
    const result: { name: string; url: string }[] = json.results;
    return result[Math.floor(Math.random() * result.length)];
  }

  /**
   * Fetches sprite URLs from a PokeAPI Pokemon resource.
   *
   * @param url The PokeAPI Pokemon URL returned by `generatePokemon`.
   * @returns The subset of the Pokemon sprite payload used by the bot.
   */
  static async fetchSprite(url: string): Promise<FetchSpriteType> {
    const res: Response = await fetch(url);
    const json = await res.json();
    const sprites: FetchSpriteType = {
      back_default: json.sprites.back_default,
      back_female: json.sprites.back_female,
      back_shiny: json.sprites.back_shiny,
      back_shiny_female: json.sprites.back_shiny_female,
      front_default: json.sprites.front_default,
      front_female: json.sprites.front_female,
      front_shiny: json.sprites.front_shiny,
      front_shiny_female: json.sprites.front_shiny_female,
      other: {
        dream_world: {
          front_default: json.sprites.other.dream_world.front_default,
          front_female: json.sprites.other.dream_world.front_female,
        },
        home: {
          front_default: json.sprites.other.home.front_default,
          front_female: json.sprites.other.home.front_female,
          front_shiny: json.sprites.other.home.front_shiny,
          front_shiny_female: json.sprites.other.home.front_shiny_female,
        },
        official_artwork: {
          front_default: json.sprites.other["official-artwork"].front_default,
        },
      },
    };
    return sprites;
  }

  /**
   * Fetches localized names for a Pokemon species.
   *
   * @param nameOrId The Pokemon species name or numeric id.
   * @returns Localized names, or null when PokeAPI has no matching species.
   */
  static async fetchNames(
    nameOrId: string,
  ): Promise<
    { languageName: string; languageUrl: string; name: string }[] | null
  > {
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${nameOrId}/`,
      );
      const json = await res.json();
      const names: { language: { name: string; url: string }; name: string }[] =
        json.names;
      return names.map(
        (name: { language: { name: string; url: string }; name: string }) => {
          return {
            languageName: name.language.name,
            languageUrl: name.language.url,
            name: name.name,
          };
        },
      );
    } catch {
      // Some Pokemon form ids have sprite data but no species-name endpoint.
      return null;
    }
  }

  /**
   * Edits a deferred slash-command reply with a localized Poke Guesser embed.
   *
   * @param interaction The command interaction whose reply should be edited.
   * @param title The embed title.
   * @param description The embed body text.
   * @param language Localized strings used for shared embed chrome.
   * @returns The edited Discord message.
   */
  static async editReply(
    interaction: ChatInputCommandInteraction,
    title: string,
    description: string,
    language: { code: string; obj: { [key: string]: string } },
  ): Promise<Message<boolean>> {
    return await interaction.editReply({
      embeds: [Util.returnEmbed(title, description, language).embed],
    });
  }

  /**
   * Converts a username display mode id to its localized label.
   *
   * @param usernameModeId The stored username mode id.
   * @param languageObject The localization object containing username labels.
   * @returns The localized label for the mode.
   */
  static translateUsernameModeId(
    usernameModeId: number,
    // deno-lint-ignore no-explicit-any
    languageObject: any,
  ): string {
    switch (usernameModeId) {
      case 0:
        return languageObject.username_mode_0;
      case 1:
        return languageObject.username_mode_1;
      case 2:
        return languageObject.username_mode_2;
      case 3:
        return languageObject.username_mode_3;
      case 4:
      default:
        return languageObject.username_mode_4;
    }
  }

  /**
   * Chooses the display name for a guild member according to a stored mode.
   *
   * @param usernameModeId The stored username mode id.
   * @param member The guild member whose display name should be formatted.
   * @returns The selected nickname, global display name, or username.
   */
  static getCorrectUsernameFormat(
    usernameModeId: number,
    member: GuildMember,
  ): string {
    switch (usernameModeId) {
      case 0:
        if (member.nickname) return member.nickname;
        if (member.user?.globalName) return member.user?.globalName;
        return member.user?.username;
      case 1:
        if (member.nickname) return member.nickname;
        return member.user?.username;
      case 2:
        if (member.user?.globalName) return member.user?.globalName;
        return member.user?.username;
      case 3:
        if (member.user?.globalName) return member.user?.globalName;
        if (member.nickname) return member.nickname;
        return member.user?.username;
      case 4:
      default:
        return member.user?.username;
    }
  }

  /**
   * Checks whether a filesystem path exists.
   *
   * @param path The file or directory path to inspect.
   * @returns True when the path exists, false when it is missing.
   */
  static async fileExists(path: string) {
    try {
      await Deno.lstat(path);
      return true;
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return false;
      } else {
        throw err;
      }
    }
  }
}
