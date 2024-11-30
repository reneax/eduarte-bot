import {
    SlashCommandBuilder,
    Collection,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ModalSubmitInteraction, SlashCommandOptionsOnlyBuilder
} from "discord.js"
import {EduarteAuth} from "./api/eduarte-auth";
import {EduarteAPI} from "./api/eduarte-api";
import {NSAPI} from "./ns/ns-api";


export interface SlashCommand {
    command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
    execute: (interaction : ChatInputCommandInteraction) => void,
    autocomplete?: (interaction: AutocompleteInteraction) => void,
    modal?: (interaction: ModalSubmitInteraction<CacheType>) => void,
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args?) => void
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TOKEN: string,
            PORTAL_URL: string,
            EDUARTE_EMAIL: string,
            EDUARTE_PASSWORD: string,
            AUTH_COOKIE: ?string,
            DEBUG: boolean,
            IS_MICROSOFT_LOGIN: boolean,
            SAVE_DATA: boolean,
            HEADLESS: boolean,
            CLIENT_ID: string,
        }
    }
}

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>
        api: EduarteAPI,
        auth: EduarteAuth,
    }
}