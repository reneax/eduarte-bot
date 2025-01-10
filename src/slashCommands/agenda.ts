import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, InteractionContextType } from "discord.js";
import { getThemeColor, refreshCookie } from "../functions";
import { SlashCommand } from "../types";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("agenda")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(8)
        .setDescription("Shows your agenda"),
    execute: async (interaction) => {
        await interaction.deferReply();
        const { auth, api } = interaction.client;

        try {
            if (!await api.isSessionValid()) {
                await refreshCookie(auth, api);
            }

            let agenda = await api.getAgenda();

            const buttons = agenda.map(schoolDay => (
                new ButtonBuilder()
                    .setCustomId(`agenda_${schoolDay.dateString}`)
                    .setLabel(schoolDay.dateString)
                    .setStyle(ButtonStyle.Primary)
            ));

            const actionRows = [];
            for (let i = 0; i < buttons.length; i += 5) {
                actionRows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
            }

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({ text: "Eduarte" })
                        .setTitle("Agenda:")
                        .setDescription("Select a date for more details.")
                        .setColor(getThemeColor("text"))
                ],
                components: actionRows
            });
        } catch (e) {
            console.log(`Failed to get agenda: ${e}`);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({ text: "Eduarte" })
                        .setDescription(`Failed to get agenda, check console for errors.`)
                        .setColor(getThemeColor("error"))
                ]
            });
        }
    },
};

export default command;