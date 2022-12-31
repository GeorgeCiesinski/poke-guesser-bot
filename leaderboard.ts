import { ApplicationCommandType, Message, ChatInputCommandInteraction } from "discord.js";
import Database from "./data/postgres";
import Util from "./util";

export default class Leaderboard {

    static async leaderboard(interaction: ChatInputCommandInteraction, db: Database) {
        if (!interaction.guild?.available) {
            await interaction.reply({
                content: 'Guild not available  (leaderboard -> leaderboard -> interaction.guild.available is either null or false)',
                ephemeral: true
            });
            return;
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'Internal Server Error (leaderboard -> leaderboard -> interaction.guildId = null)',
                ephemeral: true
            });
            return;
        }
        await interaction.deferReply({ ephemeral: false }); // PokeBot is thinking
        //const type = interaction.options.getString('type');
        let score = db.getScores(interaction.guildId);
        let title = '';
        let description = '';
        // returnEmbed(title, message, image=null)
        await Util.editReply(interaction, title, description);
    }

    static getRegisterObject() {
        return {
            name: 'leaderboard',
            description: 'Shows the Leaderboard',
            type: ApplicationCommandType.ChatInput
        };
    }
}
