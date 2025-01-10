import {EmbedBuilder, InteractionContextType, SlashCommandBuilder} from "discord.js"
import {getThemeColor} from "../functions";
import {SlashCommand} from "../types";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("ping")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(8)
        .setDescription("Shows the bot's ping"),
    execute: interaction => {
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setFooter({text: "Eduarte"})
                    .setDescription(`Ping: ${interaction.client.ws.ping}`)
                    .setColor(getThemeColor("text"))
            ]
        })
    },
}

export default command