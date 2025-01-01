# Poké-guesser Bot

Poké-guesser Bot is a discord bot that runs a Pokemon guessing game. The bot
automatically tracks the score of participating users.

# Features

## Bot Roles

The bot has the following roles:

- Admin
- Mod
- Player

You can learn more about the
[roles here](https://github.com/GeorgeCiesinski/poke-guesser-bot/wiki/Bot-Roles).

## Commands

Each role has access to certain commands. You can find out more from
[this wiki page](https://github.com/GeorgeCiesinski/poke-guesser-bot/wiki/Commands).

### Guessing / Catching

You can simply guess the pokémon name by clicking or tapping on
`Catch This Pokémon!`-button below the message that shows the pokémon that needs
to be guessed. After that a modal opens up that asks you for the name where you
need to enter it and press or tap on `Submit`. ![catch](docs/images/catch.png)

### Lightning Round

You can start a lightning round, meaning one explore after each other for a
given amount of loops, by doing `/lightning start` instead of `/explore`.

It will then automatically explore a new pokemon if the current one was caught
or revealed.

## Channel configuration

You can set which channels the bot is allowed to reply in. The bot can listen
and reply on all channels if no channels are set.

## Leaderboard

Generate a Leaderboard of the top players.

## Hosted by YOU on Docker

You can clone this repository to run it yourself through Docker Compose so you
know exactly what this bot is doing. You can also fork this repo and make any
modifications you want!

## Multi-language Support

Poké-guesser Bot supports guesses in any language supported by Poké-API.

# Installation

## Discord Bot Setup

In order to use Poke-guesser-bot, you need to setup a discord bot first using
the Discord Developer Portal.

<!-- Keep ordered lists in html format -->
<ol>
    <li>
        Login to the <a href="https://discord.com/developers/applications">Discord Developer portal</a>.
    </li>
    <li>
        Follow <a href="https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot">these instructions</a> to setup the discord bot. Save the token from this step for later.
    </li>
    <li>
        Create the <a href="https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links">Bot Invite Link</a>, but select the below permissions before using the invite link:
        <img src="docs/images/bot-4.png" alt="bot-4">
    </li>
</ol>

## Create the .env and docker.env files

<ol>
     <li>
        Clone or download the repo.
    </li>
    <li>
        Create a <code>.env</code> file if it doesn't exist. Copy the contents of <code>example.env</code> into the <code>.env</code>
    </li>
    <li>
        Add the Discord Token to the <code>.env</code> file.
        <ul>
            <li><strong>TOKEN:</strong> This is your discord token from previous steps.</li>
        </ul>
    </li>
    <li>
        Add the Database configuration to the <code>.env</code> file. There are two options:
        <ol>
            <li>
                If you use a Database URL, add it to the <code>.env</code> file as below:
                <br><code>DATABASE_URL: "postgres://user:pass@example.com:5432/dbname"</code> (your string)
            </li>
            <li>
                If you want to pass the parameters separately to the Sequelize constructor, change the below fields in the .env file:
                <ul>
                    <li><strong>POSTGRES_HOST:</strong> Connection string for Postgres server. Leave as <code>db</code> if using Docker.</li>
                    <li><strong>POSTGRES_USER & POSTGRES_PASSWORD:</strong> User/pass for postgres server. Doesn't need to be changed if using Docker.
                </ul>
            </li>
        </ol>
    </li>
    <li>
        Copy the contents of <code>.env</code> into <code>docker.env</code>
    </li>
</ol>

## Adding Slash Commands

The bot uses slash commands which need to be registered with discord.

<ol>
    <li>While still in the project directory, run <code>npm install</code> to install the required packages</li>
    <li>Then run <code>node setupCommands.js</code> to register slash commands for the bot with discord</li>
</ol>

## Running the Bot

This bot was written to run locally or on docker with NodeJS and PostgreSQL and
uses Env-Files for the senstive data that will get loaded in NodeJS as
Environment Variables.

### Run in Docker

**Important:** _You must have already set up a Discord bot on the Discord
Developer portal. If you haven't, follow the instructions in
[this](#discord-bot-setup) section first._

<ol>
    <li>
        <a href="https://docs.docker.com/get-started/">Set up Docker</a> if you haven't already.
    </li>
    <li>
        Run the bot with Docker Compose: <br><code>docker compose up -d</code><br>
    </li>
</ol>

### Run Locally

You can also run the bot using node, but the database has to be set up manually.

<ol>
    <li>
        Set up your database if you haven't already. The bot was built using Postgres but other DBs can work if they allow a connection string with user/pass. If you don't use the <code>DATABASE_URL</code> environment variable, you'd have to adjust the dialect for Sequelize in data/postgres.js.
    </li>
    <li>
        Run the command:
        <br><code>node index.js</code>
        <br>or
        <br><code>npm start</code>
    </li>
</ol>

# Technology

## PostgreSQL

The database.

## node.js

This project is written entirely using JavaScript in the
[Node.JS](https://nodejs.org/en/) runtime environment.

## discord.js

All interactions with discord were handled thanks to the
[discord.js](https://discord.js.org/#/) library.

## Poké-API

This bot would not be possible without [PokeAPI](https://pokeapi.co/). This API
provided a list of all pokémon, including their variants, as well as sprites
that were instrumental in building this Poke-guesser Bot.

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
