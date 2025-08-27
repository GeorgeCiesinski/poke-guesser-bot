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

  static help = Help.help;
  static settings = Settings.settings;
  static catchModalSubmitted = Catch.catchModalSubmitted;
  static leaderboard = Leaderboard.leaderboard;
  static score = Score.score;
  static explore = Explore.explore;
  static lightning = Lightning.lightning;
  static reveal = Reveal.reveal;
  static mod = Mod.mod;
}
