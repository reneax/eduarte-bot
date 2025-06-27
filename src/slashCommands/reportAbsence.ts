import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    InteractionContextType,
    MessageActionRowComponentBuilder,
    SlashCommandBuilder,
} from "discord.js";
import {convertTimeToDate, enumToArray, getThemeColor, getUnix, refreshCookie, validateTime,} from "../functions";
import {SlashCommand} from "../types";
import {AbsenceReason} from "../api/objects/absenceReason";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("reportabsence")
        .setContexts(InteractionContextType.Guild)
        .setDescription("Reports you absent on this day.")
        .setDefaultMemberPermissions(8)
        .addStringOption((option) =>
            option
                .setName("option")
                .setDescription("The option for the absence.")
                .setRequired(true)
                .addChoices(
                    enumToArray(AbsenceReason).map((reason) => {
                        return {
                            name: reason.label,
                            value: reason.value.toString(),
                        };
                    })
                )
        )
        .addStringOption((option) =>
            option
                .setName("end")
                .setRequired(true)
                .setDescription("The end time of the absence. The format must be HH:mm")
        )
        .addStringOption((option) =>
            option
                .setName("begin")
                .setDescription(
                    "Leaving this blank will use the current time. The format must be HH:mm"
                )
        ),
    execute: async (interaction) => {
        await interaction.deferReply();
        const {auth, api} = interaction.client;
        // @ts-ignore
        let reason = +interaction.options.getString("option");
        let beginTime = interaction.options.getString("begin");
        // @ts-ignore
        let endTime: string = interaction.options.getString("end");

        if (!validateTime(endTime) || (beginTime && !validateTime(beginTime))) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({text: "Eduarte"})
                        .setDescription(`Invalid time strings given.`)
                        .setColor(getThemeColor("error")),
                ],
            });
        }

        let beginTimeDate = beginTime ? convertTimeToDate(beginTime) : new Date();
        let endTimeDate = convertTimeToDate(endTime);

        if (endTimeDate < beginTimeDate) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setFooter({text: "Eduarte"})
                        .setDescription(`Begin time cannot be after end time.`)
                        .setColor(getThemeColor("error")),
                ],
            });
        }

        let reportDetails =
            `Reason: ${AbsenceReason[reason]}\n`
            + `Begin: <t:${getUnix(beginTimeDate)}>\n`
            + `End: <t:${getUnix(endTimeDate)}>`;

        const row =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId("confirm")
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Secondary)
            );

        let replyMessage = await interaction.editReply({
            components: [row],
            embeds: [
                new EmbedBuilder()
                    .setFooter({text: "Eduarte"})
                    .setDescription(`🕰️ **Confirm absence report**\n${reportDetails}`)
                    .setColor(getThemeColor("text")),
            ],
        });

        let filter = (buttonInteraction: ButtonInteraction) =>
            buttonInteraction.user.id === interaction.user.id &&
            buttonInteraction.message.id == replyMessage.id;

        // @ts-ignore
        let collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 30000,
        });

        collector.on("collect", async (buttonInteraction: ButtonInteraction) => {
            if (buttonInteraction.customId === "cancel") {
                await interaction.editReply({
                    components: [],
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`**Absence report cancelled**`)
                            .setColor(getThemeColor("text")),
                    ],
                });
                return;
            }

            try {
                await buttonInteraction.deferUpdate();

                if (!(await api.isSessionValid())) {
                    await refreshCookie(auth, api);
                }

                await api.reportAbsence(reason, beginTimeDate, endTimeDate);

                await interaction.editReply({
                    components: [],
                    embeds: [
                        new EmbedBuilder()
                            .setFooter({text: "Eduarte"})
                            .setDescription(`✅ **Absence report sent**\n${reportDetails}`)
                            .setColor(getThemeColor("text")),
                    ],
                });
            } catch (e) {
                console.log(`Failed to report absence: ${e}`);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setFooter({text: "Eduarte"})
                            .setDescription(
                                `Failed to report absence, check console for errors.`
                            )
                            .setColor(getThemeColor("error")),
                    ],
                });
            }
        });
    },
};

export default command;
