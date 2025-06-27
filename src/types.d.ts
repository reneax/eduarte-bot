import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Collection,
    ModalSubmitInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder
} from "discord.js"
import {EduarteAuth} from "./api/eduarte-auth";
import {EduarteAPI} from "./api/eduarte-api";


export interface SlashCommand {
    command: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder,
    execute: (interaction: ChatInputCommandInteraction) => void,
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
            TOTP_SECRET: ?string,
            AUTH_COOKIE: ?string,
            // booleans are not parsed by default.
            DEBUG: string,
            IS_MICROSOFT_LOGIN: string,
            DISABLE_SANDBOX: string,
            SAVE_DATA: string,
            HEADLESS: string,
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