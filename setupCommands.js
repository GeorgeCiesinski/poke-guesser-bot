import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { getRegisterArray } from "./commands.js";

const token = process.env.TOKEN;
if (!token) {
  throw new Error(
    "TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.",
  );
}

const rest = new REST().setToken(token);

const registerArray = getRegisterArray();

(async () => {
  try {
    console.log(
      `Started refreshing ${registerArray.length} application (/) commands.`,
    );
    const userData = await rest.get(Routes.user());
    const userId = userData.id;
    const data = await rest.put(Routes.applicationCommands(userId), {
      body: registerArray,
    });
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (err) {
    console.error(err);
  }
})();
