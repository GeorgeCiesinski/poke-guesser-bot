# Poké-guesser Bot

Poké-guesser Bot is a Discord bot that runs a Pokemon guessing game. It posts a random Pokemon encounter, lets players guess through a Discord modal, and automatically tracks participating users' scores.

# Using the Bot

## Exploring & Catching

Mods can explore with `/explore`.

explore

Players guess the Pokemon by clicking or tapping the `Catch This Pokémon!` button below an encounter message. The button opens a modal where the player enters the Pokemon name and submits the guess.

catch

A successful catch results in a high resolution image and score increase.

caught

## Lightning Round

Mods can start a lightning round with `/lightning start`. A lightning round generates one encounter after another for the configured number of loops.

The bot automatically posts the next encounter when the current Pokemon is caught or revealed.

## Settings

Admins can manage server settings with `/settings`, including:

- bot mods
- allowed bot channels
- preferred bot language
- username display format

If no channels are configured, the bot can listen and reply in every channel. Once channels are configured, commands are only allowed in those channels.

### Leaderboard And Scores

Players can use `/score show` to see a user's score and `/leaderboard` to show the top players in the server.

Mods can adjust scores with `/mod score`.

# Features

## Bot Roles & Commands

The bot has three practical access levels:

- **Admin:** the server owner or a Discord user with Administrator permission. Admins manage bot settings.
- **Mod:** users or roles added with `/settings mods add`. Mods can start, reveal, and manage game rounds.
- **Player:** everyone who can use the configured bot channels. Players can catch Pokemon and view scores.

It also registers the following global slash commands:

- `/help`
- `/settings`
- `/leaderboard`
- `/score`
- `/explore`
- `/lightning`
- `/reveal`
- `/mod`

Learn more about available roles and commands by reading the [wiki](https://github.com/GeorgeCiesinski/poke-guesser-bot/wiki).

## Multi-language Support

Poké-guesser Bot accepts Pokemon guesses using the localized species names returned by PokeAPI. Bot text and localized slash command names currently ship with English and German language files.

# Installation

Poké-guesser Bot is easiest to run with Docker Compose. The default configuration starts both the Deno bot and PostgreSQL, so most installs only need a Discord bot token.

## Prerequisites

- [Docker](https://docs.docker.com/get-started/)
- [Deno 2.x](https://docs.deno.com/runtime/) for registering slash commands

## Discord Bot Setup

Create a Discord bot application before starting the service.

1. Log in to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Follow [these instructions](/developers/quick-start/getting-started#what-are-scopes-and-permissions) to set up the Discord bot.

**Note:** Save the token from this step for later.

### Bot permissions

The bot requires the following **Text Permissions**:

- Send Messages
- Send Messages in Threads
- Embed Links
- Attach Files
- Read Message History

## Configure Environment Files

Copy the example environment into the files used by Deno and Docker Compose:

```sh
cp example.env .env
cp example.env docker.env
```

Set `TOKEN` in both files to the Discord bot token from the previous step. For the recommended Docker setup, leave the default PostgreSQL values as-is.

## Register Slash Commands

The bot uses global Discord slash commands, which need to be registered before the commands appear in Discord. Global commands can take a few minutes to show up after registration.

```sh
deno install
deno run --env -ERN src/setupCommands.ts
```

## Running the Bot

Start the Deno bot and PostgreSQL with Docker Compose:

```sh
docker compose up -d
```

To stop the bot:

```sh
docker compose down
```

# Technology

- Written in [TypeScript](https://www.typescriptlang.org/).
- Runs on [Deno](https://deno.com/).
- Stores data in [PostgreSQL](https://www.postgresql.org/) using [Sequelize](https://sequelize.org/).
- Connects to Discord servers with [discord.js](https://discord.js.org/#/).
- Gets Pokemon data from [PokeAPI](https://pokeapi.co/).

# Contributions

New contributors are welcome! Please read [CONTRIBUTING.md](docs/contributing) before making your first contribution.

# Code of Conduct

All contributors and members of our community are expected to abide by our [CODE_OF_CONDUCT.md](docs/CODE_OF_CONDUCT.md).

# Legal

- [Terms of Service](docs/TERMS_OF_SERVICE.md)
- [Privacy Policy](docs/PRIVACY_POLICY.md)

# License

- [MIT License](https://github.com/GeorgeCiesinski/poke-guesser-bot/blob/master/LICENSE).

# Additional Credit

This project was co-founded by [GeorgeCiesinski](https://github.com/GeorgeCiesinski) and [Wissididom](https://github.com/Wissididom).

Leaderboard Image by
[Aurelia Candeloro](https://www.instagram.com/aurelia.borealis).
