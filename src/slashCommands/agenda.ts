import {EmbedBuilder, InteractionContextType, SlashCommandBuilder} from "discord.js"
import {getThemeColor, refreshCookie} from "../functions";
import {SlashCommand} from "../types";
import {AgendaView} from "../api/objects/agendaView";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("agenda")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(8)
        .setDescription("Shows your agenda"),
    execute: async (interaction) => {
        await interaction.deferReply();
        const {auth, api} = interaction.client;

        try {
            if (!await api.isSessionValid()) {
                await refreshCookie(auth, api);
            }

            let agenda = await api.getAgenda();

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({ text: "Eduarte" })
                        .setTitle("Agenda:")
                        .setDescription(`${agenda.map(schoolDay => schoolDay.dateString).join("\n")}`)
                        .setColor(getThemeColor("text"))
                ],

            })
        } catch (e) {
            console.log(`Failed to get agenda: ${e}`);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({ text: "Eduarte" })
                        .setDescription(`Failed to get agenda, check console for errors.`)
                        .setColor(getThemeColor("error"))
                ]
            })
        }
    },
}

export default command