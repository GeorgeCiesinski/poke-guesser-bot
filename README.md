# Poké-guesser Bot

Poké-guesser Bot is a Discord bot that runs a Pokemon guessing game. It posts a
random Pokemon encounter, lets players guess through a Discord modal, and
automatically tracks participating users' scores.

# Features

## Bot Roles

The bot has three practical access levels:

- **Admin:** the server owner or a Discord user with Administrator permission.
  Admins manage bot settings.
- **Mod:** users or roles added with `/settings mods add`. Mods can start,
  reveal, and manage game rounds.
- **Player:** everyone who can use the configured bot channels. Players can
  catch Pokemon and view scores.

## Commands

The bot currently registers these global slash commands:

- `/help`
- `/settings`
- `/leaderboard`
- `/score`
- `/explore`
- `/lightning`
- `/reveal`
- `/mod`

### Guessing / Catching

Players guess the Pokemon by clicking or tapping the `Catch This Pokémon!`
button below an encounter message. The button opens a modal where the player
enters the Pokemon name and submits the guess. ![catch](docs/images/catch.png)

### Lightning Round

Mods can start a lightning round with `/lightning start`. A lightning round
generates one encounter after another for the configured number of loops.

The bot automatically posts the next encounter when the current Pokemon is
caught or revealed.

### Settings

Admins can manage server settings with `/settings`, including:

- bot mods
- allowed bot channels
- preferred bot language
- username display format

If no channels are configured, the bot can listen and reply in every channel.
Once channels are configured, commands are only allowed in those channels.

### Leaderboard And Scores

Players can use `/score show` to see a user's score and `/leaderboard` to show
the top players in the server.

Mods can adjust scores with `/mod score`.

### Moderation Commands

`/mod delay`, `/mod timeout`, and `/mod championship` are registered command
groups, but their backing behavior is still a TODO in the current codebase.

## Hosted by YOU on Docker

You can clone this repository to run it yourself through Docker Compose so you
know exactly what this bot is doing. You can also fork this repo and make any
modifications you want!

## Multi-language Support

Poké-guesser Bot accepts Pokemon guesses using the localized species names
returned by PokeAPI. Bot text and localized slash command names currently ship
with English and German language files.

# Installation

## Discord Bot Setup

In order to use Poké-guesser Bot, you need to set up a Discord bot first using
the Discord Developer Portal.

<!-- Keep ordered lists in html format -->
<ol>
    <li>
        Log in to the <a href="https://discord.com/developers/applications">Discord Developer Portal</a>.
    </li>
    <li>
        Follow <a href="https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot">these instructions</a> to set up the Discord bot. Save the token from this step for later.
    </li>
    <li>
        Create the <a href="https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links">bot invite link</a>, but select the permissions shown below before using the invite link:
        <img src="docs/images/bot-4.png" alt="bot-4">
    </li>
</ol>

## Create the .env and docker.env files

<ol>
    <li>
        Clone or download the repo.
    </li>
    <li>
        Create a <code>.env</code> file if it does not exist. Copy the contents of <code>example.env</code> into <code>.env</code>.
    </li>
    <li>
        Add the Discord token to <code>.env</code>.
        <ul>
            <li><strong>TOKEN:</strong> The Discord bot token from the previous setup steps.</li>
        </ul>
    </li>
    <li>
        Add the PostgreSQL database configuration to <code>.env</code>. There are two supported options:
        <ol>
            <li>
                Use a database URL:
                <br><code>DATABASE_URL=postgres://user:pass@example.com:5432/dbname</code>
            </li>
            <li>
                Or configure the separate PostgreSQL fields:
                <ul>
                    <li><strong>POSTGRES_HOST:</strong> Postgres host. Leave as <code>db</code> when using Docker Compose.</li>
                    <li><strong>POSTGRES_USER:</strong> Postgres user.</li>
                    <li><strong>POSTGRES_PASSWORD:</strong> Postgres password.</li>
                    <li><strong>POSTGRES_PORT:</strong> Postgres port. Defaults to <code>5432</code>.</li>
                    <li><strong>POSTGRES_DB:</strong> Postgres database name. Defaults to <code>pokebot</code>.</li>
                </ul>
            </li>
        </ol>
    </li>
    <li>
        If you run with Docker Compose, copy the same values into <code>docker.env</code>. The Compose file uses <code>docker.env</code> for both the bot and Postgres services.
    </li>
</ol>

## Adding Slash Commands

The bot uses global Discord slash commands, which need to be registered before
the commands appear in Discord.

<ol>
    <li>Install Deno 2.x if it is not already installed.</li>
    <li>While still in the project directory, run <code>deno install</code> to cache dependencies.</li>
    <li>Run <code>deno run --env -ERN src/setupCommands.ts</code> to register slash commands for the bot with Discord.</li>
</ol>

## Running the Bot

This bot runs locally or in Docker with Deno and PostgreSQL. Sensitive
configuration is loaded from environment variables.

### Run in Docker

**Important:** _You must have already set up a Discord bot on the Discord
Developer Portal. If you haven't, follow the instructions in
[this](#discord-bot-setup) section first._

<ol>
    <li>
        <a href="https://docs.docker.com/get-started/">Set up Docker</a> if you haven't already.
    </li>
    <li>
        Create <code>docker.env</code> using the values described above.
    </li>
    <li>
        Run the bot and Postgres with Docker Compose:
        <br><code>docker compose up -d</code><br>
    </li>
</ol>

### Run Locally

You can also run the bot directly with Deno, but PostgreSQL must be running and
reachable from your local environment.

<ol>
    <li>
        Install <a href="https://docs.deno.com/runtime/">Deno 2.x</a>.
    </li>
    <li>
        Set up PostgreSQL and configure <code>.env</code> with either <code>DATABASE_URL</code> or the separate <code>POSTGRES_*</code> variables.
    </li>
    <li>
        Cache dependencies:
        <br><code>deno install</code>
    </li>
    <li>
        Start the bot:
        <br><code>deno task start</code>
    </li>
    <li>
        For development with file watching, run:
        <br><code>deno task dev</code>
    </li>
</ol>

## Development

Run the test suite with:

```sh
deno task test
```

# Technology

## Deno

This project is written in TypeScript and runs on
[Deno](https://deno.com/).

## PostgreSQL

PostgreSQL stores guild settings, active encounters, score data, artwork URLs,
and lightning round state. The bot connects through Sequelize.

## discord.js

All interactions with Discord are handled with
[discord.js](https://discord.js.org/#/).

## PokeAPI

This bot would not be possible without [PokeAPI](https://pokeapi.co/). This API
provides the Pokemon list, localized species names, sprites, and official
artwork used by Poké-guesser Bot.

# Contributions

If you are interested in making a contribution, please read our **Contributions
Guidelines** located in `docs/CONTRIBUTING.md`.

# Terms of Conduct

Before participating in this community, please read our **Code of Conduct**
located in `docs/CODE_OF_CONDUCT.md`.

# License

[MIT](https://github.com/GeorgeCiesinski/poke-guesser-bot/blob/master/LICENSE)

# Additional Credit

Code Contributions by [Wissididom](https://github.com/Wissididom)

Replit Cover Image by [PIRO4D](https://pixabay.com/users/piro4d-2707530/) from
[Pixabay](https://pixabay.com)

Leaderboard Image by
[Aurelia Candeloro](https://www.instagram.com/aurelia.borealis)
