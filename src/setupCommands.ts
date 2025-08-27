import { REST, Routes } from "discord.js";
import Commands from "./commands.ts";

const token = Deno.env.get("TOKEN");

if (!token) {
  throw new Error(
    "TOKEN not found! You must setup the Discord TOKEN as per the README file before running this bot.",
  );
}

const rest = new REST().setToken(token);

const registerArray = Commands.getRegisterArray();

(async () => {
  try {
    console.log(
      `Started refreshing ${registerArray.length} application (/) commands.`,
    );
    const userData = await rest.get(Routes.user());
    const userId: string = userData.id;
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
