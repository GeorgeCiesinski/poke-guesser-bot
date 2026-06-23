# Terms of Service

Last Updated: June 20, 2026

## 1. Acceptance of Terms

By inviting, accessing, or using Poke Guesser Bot ("the Bot") in a Discord server, you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Bot.

These Terms apply to your use of a **running Bot instance**. They do not replace the [MIT License](../LICENSE), which governs use of the project's source code.

## 2. Description of Service

Poke Guesser Bot is an open-source Discord bot that provides Pokémon-themed guessing games and related features within Discord servers ("Guilds"), including:

- Random Pokémon encounters started with `/explore`
- Player guesses submitted through Discord modals
- Lightning rounds via `/lightning`
- Score tracking, `/leaderboard`, and `/score`
- Server configuration through `/settings` (mods, allowed channels, language, username display)
- Moderator tools through `/mod` (score adjustments and related commands)

The Bot is provided **free of charge**. It does not offer paid features, subscriptions, or user accounts.

## 3. Open Source and Self-Hosted Software

Poke Guesser Bot is open-source software that anyone may download, modify, and run. Because of that, **more than one person or organization may operate a Bot instance**.

- **Project maintainers** develop and publish the software. Unless they explicitly state otherwise, they do not operate every instance of the Bot.
- **Instance operators** are the people or organizations that deploy and run the Bot for a particular Discord server or set of servers. This includes self-hosters and anyone running their own deployment.

When these Terms refer to "the operator," we mean the party running the Bot instance you interact with. When these Terms refer to "project maintainers," we mean the contributors who publish this repository.

If you self-host the Bot, **you are the operator** for your deployment and are responsible for how it is run and how data is handled. See Section 5.

## 4. Eligibility

You may use the Bot only if:

- You meet Discord's minimum age and account requirements for your region
- Your use complies with Discord's Terms of Service, Community Guidelines, and Developer Policy
- Your use complies with applicable laws

Do not use the Bot where such use is prohibited by law or platform policy.

## 5. Server Administrator Responsibilities

If you invite the Bot to a Discord server or configure it, you act as the **operator** for that instance (unless someone else runs the deployment on your behalf). As an operator, you are responsible for:

- Deciding which channels, moderators, and settings apply in your server
- Informing your community that the Bot is in use and what data it stores (see the [Privacy Policy](PRIVACY_POLICY.md))
- Ensuring moderators use Bot tools appropriately, including score adjustments
- Complying with Discord's requirements for server owners and administrators
- Maintaining the infrastructure you use to run the Bot, including databases and backups

Project maintainers are not responsible for how third parties configure or operate their own deployments.

## 6. Compliance with Discord Terms

Users and operators must comply with all applicable Discord terms, policies, and community guidelines while using the Bot.

You may not use the Bot to violate Discord's Terms of Service or any applicable laws or regulations.

## 7. User Conduct

You agree not to:

- Abuse, exploit, or attempt to disrupt the Bot
- Interfere with the operation of the Bot or its infrastructure
- Attempt unauthorized access to the Bot, its database, or hosting environment
- Use automated means to abuse gameplay or gain unfair advantages
- Harass other users through Bot interactions or related gameplay

Operators may restrict or remove users from Bot features within their server in line with their own moderation policies.

## 8. Gameplay and Leaderboards

- Scores and leaderboards are **local to each Discord server**. There is no global, cross-server ranking maintained by the project.
- Server moderators and administrators can add, remove, or set scores through `/mod score` and related commands.
- Game outcomes, cooldowns, and round state depend on server configuration and operator uptime.
- No guarantee is made regarding competitive fairness, ranking accuracy, or preservation of scores across Bot updates, database resets, or server changes.

## 9. Data and Privacy

The Bot stores limited information needed to provide its functionality. It does not store Discord message content outside what users submit through Bot commands and modals.

For a complete description of what is collected, how it is used, retention, and third-party services, see the [Privacy Policy](PRIVACY_POLICY.md).

## 10. Third-Party Services

The Bot relies on services not controlled by the project maintainers:

- **Discord** — platform used to deliver commands, messages, and modals
- **PokeAPI** — Pokémon species data and sprite or artwork URLs fetched at runtime
- **PostgreSQL** — database used by the operator to persist server and game state

Your use of those services may be subject to their own terms and policies. The Bot is not affiliated with, endorsed by, or sponsored by the providers of those services, except where Discord is the platform on which the Bot operates.

## 11. Intellectual Property

Pokémon and related names, images, and trademarks are the property of their respective owners.

Poke Guesser Bot is a fan-made project and is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak, The Pokémon Company, or Discord.

Project source code is licensed under the [MIT License](../LICENSE). That license governs the software itself and is separate from these Terms.

## 12. Availability and Disclaimer

Each Bot instance is provided on an **"as is"** and **"as available"** basis.

No guarantee is made regarding:

- Uptime or availability
- Reliability or accuracy of game data, scores, or rankings
- Error-free operation
- Continued support, maintenance, or feature availability

Features may be added, changed, or removed in new releases. Operators choose when or whether to update their deployment.

## 13. Limitation of Liability

To the maximum extent permitted by law:

- **Project maintainers** shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from your use of the software or any Bot instance, except where liability cannot be excluded by law.
- **Instance operators** are responsible for their own deployments, configurations, and the data they store. If you operate a self-hosted instance, you assume responsibility for that service to your users.

Use of the Bot is at your own risk.

## 14. Termination and Data Removal

How use of the Bot ends depends on who operates the instance:

- **Self-hosted or third-party deployments:** The server operator may remove the Bot from a Guild, stop running it, reset settings with `/settings reset`, or delete stored data from their database at any time.
- **Deployments operated by project maintainers:** The maintainers may restrict or revoke access to that instance for violations of these Terms or for operational reasons.

Removing the Bot from a server does not automatically delete all stored data unless the operator configures cleanup or deletes the database. See the [Privacy Policy](PRIVACY_POLICY.md) for details.

## 15. Changes to These Terms

These Terms may be updated from time to time. The "Last Updated" date at the top of this document will change when they do.

Continued use of the Bot after updated Terms are published constitutes acceptance of the revised Terms. Operators should review updates when upgrading to a new release.

## 16. Contact

For questions about these Terms or the open-source project:

- Open an issue on the [GitHub repository](https://github.com/GeorgeCiesinski/poke-guesser-bot/issues)
- Use the contact methods listed on the repository page

For questions about a specific Bot instance in your Discord server, contact the **operator** of that deployment (typically your server administrators).
