import {EmbedBuilder, InteractionContextType, SlashCommandBuilder} from "discord.js"
import {getThemeColor, getUnix, refreshCookie} from "../functions";
import {SlashCommand} from "../types";
import {AgendaView} from "../api/objects/agendaView";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("subjects")
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(8)
        .setDescription("Shows the subjects of a school day.")
        .addStringOption(option =>
            option.setName('schoolday')
                .setDescription('The date string of the school day.')
                .setRequired(true),
        ),
    execute: async (interaction) => {
        await interaction.deferReply();
        const {auth, api} = interaction.client;
        const schoolDayString = interaction.options.getString("schoolday", true);

        try {
            if (!await api.isSessionValid()) {
                await refreshCookie(auth, api);
            }

            let agenda = await api.getAgenda();
            let schoolDay = agenda.filter(schoolDay => schoolDay.dateString === schoolDayString)[0];

            if (!schoolDay) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setFooter({text: "Eduarte"})
                            .setDescription(`Could not find school day.`)
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