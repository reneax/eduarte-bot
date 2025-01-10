import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { getThemeColor, getUnix, refreshCookie } from "../functions";
import { BotEvent } from "../types";

const event: BotEvent = {
    name: "interactionCreate",
    execute: async (interaction: ButtonInteraction) => {
        if (!interaction.isButton()) return;

        const { client } = interaction;
        const { api, auth } = client;

        if (interaction.customId.startsWith("agenda_")) {
            const dateString = interaction.customId.replace("agenda_", "");
            try {
                if (!(await api.isSessionValid())) {
                    await refreshCookie(auth, api);
                }

                const agenda = await api.getAgenda();
                const selectedDay = agenda.find(day => day.dateString === dateString);

                if (!selectedDay) {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setFooter({ text: "Eduarte" })
                                .setDescription(`The selected school day (${dateString}) was not found.`)
                                .setColor(getThemeColor("error"))
                        ],
                    });
                    return;
                }

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setFooter({ text: "Eduarte" })
                            .setTitle(`Subjects for ${dateString}:`)
                            .setDescription(selectedDay.subjects.map(subject =>
                                `Name: ${subject.name}\nClass: ${subject.location} | ${subject.className}\n` +
                                `Starts: <t:${subject.startTimeObject && getUnix(subject.startTimeObject)}>\n` +
                                `Ends: <t:${subject.endTimeObject && getUnix(subject.endTimeObject)}>\n` +
                                `Teacher: ${subject.teacher}\n` +
                                `Absence: ${subject.absenceStatus}`
                            ).join("\n-----------------------------\n"))
                            .setColor(getThemeColor("text"))
                    ],
                });
            } catch (e) {
                console.log(`Failed to get subjects: ${e}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setFooter({text: "Eduarte"})
                            .setDescription(`Failed to get subjects, check console for errors.`)
                            .setColor(getThemeColor("error"))
                    ]
                })
            }
        }
    }
};

export default event;