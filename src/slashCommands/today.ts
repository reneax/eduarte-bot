import {EmbedBuilder, InteractionContextType, SlashCommandBuilder} from "discord.js"
import {getThemeColor, getUnix, refreshCookie} from "../functions";
import {SlashCommand} from "../types";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("today")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(8)
        .setDescription("Shows the subjects of today."),
    execute: async (interaction) => {
        await interaction.deferReply();
        const {auth, api} = interaction.client;

        try {
            if (!await api.isSessionValid()) {
                await refreshCookie(auth, api);
            }

            let agenda = await api.getAgenda();
            let schoolDay = agenda.filter(schoolDay => schoolDay.dateObject.toDateString() == new Date().toDateString())[0];

            if (!schoolDay) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setFooter({text: "Eduarte"})
                            .setDescription(`Could not find subjects for today.\nAre you sure that you have school today?`)
                            .setColor(getThemeColor("error"))
                    ]
                })
            }

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({text: "Eduarte"})
                        .setTitle("Subjects:")
                        .setDescription(schoolDay.subjects.map(subject =>
                            `Name: ${subject.name}\nClass: ${subject.location} | ${subject.className}\nStarts: <t:${subject.startTimeObject && getUnix(subject.startTimeObject)}>\nEnds: <t:${subject.endTimeObject && getUnix(subject.endTimeObject)}>\nTeacher: ${subject.teacher}\nAbsence: ${subject.absenceStatus}`
                        ).join("\n-----------------------------\n"))
                        .setColor(getThemeColor("text"))
                ],

            })
        } catch (e) {
            console.log(`Failed to get agenda: ${e}`);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({text: "Eduarte"})
                        .setDescription(`Failed to get agenda, check console for errors.`)
                        .setColor(getThemeColor("error"))
                ]
            })
        }
    },
}

export default command