/**
 * Provides shared English localization fixtures for tests that exercise
 * language-dependent helpers.
 */
import enUS from "../../src/languages/en_US.json" with { type: "json" };

export const enLanguage = {
  code: "en_US",
  obj: enUS as { [key: string]: string },
};

export const usernameModeLabels = {
  username_mode_0: enUS.username_mode_0,
  username_mode_1: enUS.username_mode_1,
  username_mode_2: enUS.username_mode_2,
  username_mode_3: enUS.username_mode_3,
  username_mode_4: enUS.username_mode_4,
};
