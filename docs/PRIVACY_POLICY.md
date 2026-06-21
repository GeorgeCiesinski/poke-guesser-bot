# Privacy Policy

Last Updated: June 20, 2026

## 1. Overview

This Privacy Policy describes how **Poke Guesser Bot** ("the Bot") handles information when you use a running Bot instance in Discord.

Poke Guesser Bot is open-source, self-hostable software. **Who is responsible for your data depends on who runs the Bot instance you use:**

- If your Discord server uses a **self-hosted or third-party deployment**, the **instance operator** (usually your server owner or the person who deployed the Bot) is responsible for the data stored for that server.
- **Project maintainers** develop the software but do not necessarily operate every instance of the Bot.

This policy describes what the Bot software is designed to store and how that data is used. Operators may have additional obligations under applicable privacy laws in their region.

## 2. Information the Bot Stores

When the Bot is used in a Discord server, it may store the following in a PostgreSQL database operated by the instance operator:

### Discord identifiers

- **Guild (server) IDs** — to scope settings and game state to your server
- **Channel IDs** — for allowed-channel settings and per-channel game state
- **User IDs** — for scores, leaderboard entries, and moderator allowlists
- **Role IDs** — when a Discord role is configured as a Bot moderator

### Game and settings data

- **Scores** — points earned by users within a server
- **Leaderboard rankings** — derived from stored scores
- **Active encounter state** — accepted Pokémon names and related language codes for ongoing rounds
- **Artwork URLs** — links to reveal images associated with active encounters
- **Explore timestamps** — cooldown timing for `/explore` in a channel
- **Lightning round state** — remaining loop count for active lightning rounds
- **Language preference** — per-server language setting
- **Username display mode** — how player names appear in Bot messages
- **Moderator allowlist** — which users or roles may use moderator commands

### What the Bot does not store

The Bot is not designed to store:

- Discord message content outside Bot commands and modal submissions
- Direct messages unrelated to Bot interactions
- Email addresses, payment information, or real-world identity documents
- Cross-server player profiles or global accounts
- Full Discord usernames or avatars (the Bot may display these from Discord at runtime but does not persist them as profile records)

## 3. How Information Is Used

Stored information is used only to operate Bot features, including:

- Running Pokémon guessing games and lightning rounds
- Validating guesses and tracking catches
- Displaying scores and leaderboards
- Enforcing server-specific settings (channels, language, moderators)
- Applying moderator actions such as score adjustments

The Bot does not sell user data or use it for advertising.

## 4. Information Processed Without Long-Term Storage

At runtime, the Bot may temporarily process:

- Text you submit in Bot modals (for example, a Pokémon name guess)
- Discord member and role information needed to check permissions or format replies
- Responses from external APIs described in Section 5

Guess text is used to evaluate the current encounter and is not designed to be retained as a message history after the interaction completes.

## 5. Third-Party Services

The Bot communicates with services outside your Discord server:

| Service | Purpose | Data involved |
|---|---|---|
| **Discord** | Commands, messages, modals, permissions | Discord IDs, interaction content, and metadata required by the Discord API |
| **PokeAPI** | Pokémon species names and sprite or artwork URLs | Pokémon identifiers and API requests; no Discord user data is sent to PokeAPI by design |
| **PostgreSQL** | Persistent storage | The data listed in Section 2, stored on infrastructure controlled by the operator |

Each third-party service has its own privacy practices. Discord's policies apply to your use of Discord itself. PokeAPI is an independent open-source API project and is not operated by the Poke Guesser Bot maintainers.

## 6. Data Location and Security

Because the Bot is self-hostable:

- Data is stored in the **operator's PostgreSQL database**, not in a centralized service operated by the project maintainers (unless a maintainer explicitly runs a shared instance).
- Security, backups, access controls, and retention are the **operator's responsibility** for their deployment.

Project maintainers recommend that operators protect database credentials, restrict network access, and keep deployments updated.

## 7. Data Retention

By default, the Bot retains stored data until it is changed or removed through normal operation, including:

- Score updates or moderator score commands
- `/settings reset` or related configuration changes
- Manual database maintenance by the operator

**Removing the Bot from a Discord server does not automatically delete stored data** unless the operator configures cleanup or deletes the database.

Operators decide how long to keep backups and when to purge old records.

## 8. Your Choices and Rights

What you can do depends on who operates the Bot:

- **Players:** Contact your Discord server administrators if you want information about scores or settings in that server, or if you want moderator actions reviewed.
- **Server administrators / operators:** You can reset Bot settings, adjust or remove scores, remove the Bot from your server, and delete data from your database.
- **All users:** You may stop interacting with the Bot at any time.

Privacy rights (such as access, correction, or deletion requests) should generally be directed to the **instance operator**, because they control the database for your server.

For questions about the open-source project or this policy document, open an issue on the [GitHub repository](https://github.com/GeorgeCiesinski/poke-guesser-bot/issues).

## 9. Children and Age Requirements

The Bot is intended for use through Discord. You must meet Discord's minimum age requirements for your country or region.

The Bot does not knowingly collect personal information directly from children outside what Discord makes available through normal API interactions. Operators should ensure their server complies with applicable rules for minors.

## 10. International Users

Bot instances may be operated in any country. Operators are responsible for complying with privacy laws that apply to their deployment and user base.

This policy is written in English. If a translated version is provided, the English version governs in case of conflict unless local law requires otherwise.

## 11. Changes to This Policy

This Privacy Policy may be updated from time to time. The "Last Updated" date at the top will change when it does.

Continued use of the Bot after an update is published constitutes acceptance of the revised policy, subject to any rights you may have under applicable law.

## 12. Contact

- **Project / software questions:** [GitHub Issues](https://github.com/GeorgeCiesinski/poke-guesser-bot/issues) or contact methods on the repository page
- **Data in a specific Discord server:** your server administrators or the operator of that Bot instance

For security vulnerabilities, please use [GitHub security advisories](https://github.com/GeorgeCiesinski/poke-guesser-bot/security/advisories/new) rather than a public issue.
