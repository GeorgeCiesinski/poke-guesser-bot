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
  // Wraps reply in poke-guesser themed embed
  static returnEmbed(
    title: string,
    description: string,
    language: { code: string; obj: { [key: string]: string } },
    color: number = 0x00ae86,
    image: string | null = null,
  ): { embed: EmbedBuilder; attachment: AttachmentBuilder | null } {
    // Creates new embedded message
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
    // Adds image (if applicable) and returns both (if applicable)
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

  // Capitalizes first letter of pokemon name
  static capitalize(str: string): string {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
  }

  // Finds the GuildMember by User-IDs (either string or array)
  static async findMember(
    interaction: BaseInteraction,
    id: string,
  ): Promise<GuildMember | undefined> {
    // Return member or undefined if not found (force specifies if cache should be checked)
    // I could have omitted the force property, but i have put it there to make it clear
    return await interaction.guild?.members.fetch({ user: id, force: false });
  }

  // Finds the User by User-ID
  static async findUser(
    interaction: BaseInteraction,
    id: string,
  ): Promise<User | undefined> {
    return await interaction.client.users.fetch(id, { force: false });
  }

  static isAdmin(member: GuildMember): boolean {
    return (
      member.id == member.guild.ownerId ||
      member.permissions.has(PermissionsBitField.Flags.Administrator)
    );
  }

  static isUser(
    mentionable: User | GuildMember | APIGuildMember | Role | APIRole,
  ): boolean {
    return mentionable instanceof User || mentionable instanceof GuildMember;
  }

  static isRole(
    mentionable: User | GuildMember | APIGuildMember | Role | APIRole,
  ): boolean {
    return mentionable instanceof Role;
  }

  static async generatePokemon(): Promise<{ name: string; url: string }> {
    // Fetch json of all available pokemon up to a limit of 2000 (~1200 available)
    const res: Response = await fetch(
      "https://pokeapi.co/api/v2/pokemon/?limit=2000",
    );
    const json = await res.json();
    const result: { name: string; url: string }[] = json.results;
    return result[Math.floor(Math.random() * result.length)];
  }

  // Fetches the sprite using the pokemon's api url
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
      // For example id 10220 returns 404 Not Found
      return null;
    }
  }

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
}
