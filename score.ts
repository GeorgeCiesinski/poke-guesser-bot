import { ApplicationCommandType, ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import Database from "./data/postgres";
import Language from './language';
import Util from './util';

export default class Score {

    static async score(interaction: ChatInputCommandInteraction, db: Database) {
        if (!interaction.guild?.available) {
            await interaction.reply({
                content: 'Guild not available  (score -> score -> interaction.guild.available is either null or false)',
                ephemeral: true
            });
            return;
        }
        if (!interaction.guildId) {
            await interaction.reply({
                content: 'Internal Server Error (score -> score -> interaction.guildId = null)',
                ephemeral: true
            });
            return;
        }
        await interaction.deferReply({ ephemeral: false }); // PokeBot is thinking
        const lang = await Language.getLanguage(interaction.guildId, db);
        let title = '';
        let description = '';
        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'show':
                let user = interaction.options.getUser('user', false);
                if (!user)
                    user = interaction.user;
                let userScore = await db.getScore(interaction.guildId, user.id);
                title = user.tag;
                if (userScore)
                    description = `**User**: <@${user.id}>\n**Position**: ${userScore.position}\n**Score**: ${userScore.score}`;
                else
                    description = `**User**: <@${user.id}>\n**Position**: N/A\n**Score**: N/A`;
                break;
        }
        // returnEmbed(title, message, image=null)
        await Util.editReply(interaction, title, description, lang);
    }

    static getRegisterObject() {
        return {
            name: 'score',
            description: 'Shows the score of someone or yourself',
            type: ApplicationCommandType.ChatInput,
            options: [
                {
                    name: 'show',
                    description: 'Shows the Score of someone or yourself',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'user',
                            description: 'The user whose score you want to know',
                            required: false,
                            type: ApplicationCommandOptionType.User
                        }
                    ]
                }
            ]
        };
    }
}
