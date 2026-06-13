/**
 * Exposes the bot's command registry and forwards command handlers from their
 * individual modules through one importable facade.
 */
import Help from "./help.ts";
import Settings from "./settings.ts";
import Leaderboard from "./leaderboard.ts";
import Score from "./score.ts";
import Explore from "./explore.ts";
import Lightning from "./lightning.ts";
import Reveal from "./reveal.ts";
import Mod from "./mod.ts";
import Catch from "./catch.ts";

export default class Commands {
  /**
   * Builds the slash-command registration payload for every command module.
   *
   * @returns The command builders submitted to Discord during registration.
   */
  static getRegisterArray() {
    return [
      Help.getRegisterObject(),
      Settings.getRegisterObject(),
      Leaderboard.getRegisterObject(),
      Score.getRegisterObject(),
      Explore.getRegisterObject(),
      Lightning.getRegisterObject(),
      Reveal.getRegisterObject(),
      Mod.getRegisterObject(),
    ];
  }

  /** Handles the `/help` command. */
  static help = Help.help;

  /** Handles the `/settings` command. */
  static settings = Settings.settings;

  /** Handles catch modal submissions opened from encounter buttons. */
  static catchModalSubmitted = Catch.catchModalSubmitted;

  /** Handles the `/leaderboard` command. */
  static leaderboard = Leaderboard.leaderboard;

  /** Handles the `/score` command. */
  static score = Score.score;

  /** Handles the `/explore` command. */
  static explore = Explore.explore;

  /** Handles the `/lightning` command. */
  static lightning = Lightning.lightning;

  /** Handles the `/reveal` command. */
  static reveal = Reveal.reveal;

  /** Handles the `/mod` command. */
  static mod = Mod.mod;
}
