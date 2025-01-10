import {Interaction} from "discord.js";
import {BotEvent} from "../types";

const event: BotEvent = {
    name: "interactionCreate",
    execute: (interaction: Interaction) => {
        if (interaction.isChatInputCommand()) {
            let command = interaction.client.slashCommands.get(interaction.commandName)
            if (command) command.execute(interaction)
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.slashCommands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                if (!command.autocomplete) return;
                command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isModalSubmit()) {
            const command = interaction.client.slashCommands.get(interaction.customId);
            if (!command) {
                console.error(`No command matching ${interaction.customId} was found.`);
                return;
            }
            try {
                if (!command.modal) return;
                command.modal(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    }
}

export default event;