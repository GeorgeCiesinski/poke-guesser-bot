# Contributing to Poke-guesser Bot

Thanks for helping improve Poke-guesser Bot. This guide covers the expected workflow for code, documentation, bug fixes, and feature contributions.

Before contributing, please read and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before You Start

- Search existing [issues](https://github.com/GeorgeCiesinski/poke-guesser-bot/issues) and pull requests before opening new work.
- For larger changes, open an issue first so the approach can be discussed.
- Contributions must be your own work, and you must have the right to provide them under this project's license.
- Do not commit secrets, tokens, `.env`, or `docker.env` files.

## Branching Workflow

Start by forking the repository on GitHub and cloning your fork locally. Create your contribution branch from the latest `develop` branch, then push your branch to your fork and open a pull request back to this repository's `develop` branch.

Keep your fork up to date while you work. GitHub's [syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) guide explains the recommended ways to do this.

Contributions must be made on a feature or bugfix branch created from `develop`. Follow the [Gitflow workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) for branch naming and pull request flow.

Use these branch prefixes:

- `feature/<short-description>` for new features or enhancements.
- `bugfix/<short-description>` for bug fixes.
- `hotfix/<short-description>` only for urgent production fixes, usually after maintainer discussion.

Do not open code changes directly against `main` or `master`. Pull requests should target `develop` for code review.

## Development Setup

Install [Deno 2.x](https://docs.deno.com/runtime/) before working on the project. From the repository root, cache dependencies with:

```sh
deno install
```

To run the bot locally in watch mode, configure your environment as described in the README and run:

```sh
deno task dev
```

The recommended runtime setup for using the bot is Docker Compose. Local Deno commands are primarily used for development, tests, linting, formatting, and slash command registration.

## Tests And Quality Checks

Run these checks before opening a pull request:

```sh
deno fmt
deno lint
deno task test
```

New features should include focused unit tests when practical. Bug fixes should include a regression test when the issue can be reproduced in tests. Existing tests live in [`../test`](../test).

If tests are not practical for a change, explain why in the pull request and describe how you manually verified the behavior.

## Pull Requests

Open pull requests into the `develop` branch. In the pull request description, include:

- What changed and why.
- Any related issue.
- What tests or manual checks you ran.
- Whether documentation updates are needed.

Call out documentation impact clearly, especially for new commands, changed command behavior, setup changes, language changes, or other user-facing features. If documentation changes are part of the contribution, include them in the same pull request when possible.

Before requesting review, make sure:

- Your branch is based on the latest `develop`.
- Formatting, linting, and tests pass locally.
- The change is focused and avoids unrelated cleanup.
- New behavior is covered by tests when practical.
- Relevant README, docs, or wiki updates are included or noted.

## Issues, Bugs, And Feature Requests

Use GitHub issues for bug reports, questions, and feature requests:

- For bugs, use the `Bug report` template and include steps to reproduce, expected behavior, actual behavior, logs or stack traces if available, and relevant platform details.
- For feature requests, use the `New Feature` template and explain the use case, expected behavior, and why the change fits the project.
- For security vulnerabilities, use [GitHub security advisories](https://github.com/GeorgeCiesinski/poke-guesser-bot/security/advisories/new) instead of a public issue.

## Documentation Changes

Update documentation when your change affects how users or contributors interact with the project. This includes new commands, changed command behavior, setup changes, language support changes, and new operational requirements.

If documentation should change but is outside the scope of your pull request, note that clearly in the pull request description.

## Commit Messages

Use clear, descriptive commit messages that explain the purpose of the change. Keep commits focused so reviewers can follow the work easily.
