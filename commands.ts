import Help from "./help";
import Settings from "./settings";
import Leaderboard from "./leaderboard";
import Score from "./score";
import Explore from "./explore";
import Reveal from "./reveal";
import Mod from "./mod";
import Catch from "./catch";

export default class Commands {
  static getRegisterObject() {
    return {
      help: Help.getRegisterObject(),
      settings: Settings.getRegisterObject(),
      leaderboard: Leaderboard.getRegisterObject(),
      score: Score.getRegisterObject(),
      explore: Explore.getRegisterObject(),
      reveal: Reveal.getRegisterObject(),
      mod: Mod.getRegisterObject(),
    };
  }

  static help = Help.help;
  static settings = Settings.settings;
  static catchModalSubmitted = Catch.catchModalSubmitted;
  static leaderboard = Leaderboard.leaderboard;
  static score = Score.score;
  static explore = Explore.explore;
  static reveal = Reveal.reveal;
  static mod = Mod.mod;
}
