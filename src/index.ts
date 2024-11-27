import {Client, Collection, GatewayIntentBits, PermissionFlagsBits,} from "discord.js";
import {SlashCommand} from "./types";
import {config} from "dotenv";
import {readdirSync} from "fs";
import {join} from "path";
import {color} from "./functions";
import {EduarteAuth} from "./api/eduarte-auth";
import {EduarteAPI} from "./api/eduarte-api";

(async () => {
    const {Guilds, MessageContent, GuildMessages, GuildMembers} = GatewayIntentBits
    const client = new Client({intents: [Guilds, MessageContent, GuildMessages, GuildMembers]})

    config()

    client.slashCommands = new Collection<string, SlashCommand>()

    try {
        console.log(color("text", `🌠 Logging into Eduarte..`))

        client.auth = new EduarteAuth(
            process.env.PORTAL_URL,
            process.env.HEADLESS,
            process.env.SAVE_DATA
        );

        let authCookie = process.env.AUTH_COOKIE;

        if (!authCookie) {
            authCookie = await client.auth.loginMicrosoft(
                process.env.EDUARTE_EMAIL,
                process.env.EDUARTE_PASSWORD
            );
        }

        client.api = new EduarteAPI(process.env.PORTAL_URL, authCookie);
    } catch (e) {
        console.log(color("error", `❌ Eduarte login failed, reason: ${e}.`))
        process.exit(0);
    }

    const handlersDir = join(__dirname, "./handlers")
    readdirSync(handlersDir).forEach(handler => {
        if (!handler.endsWith(".js")) return;
        require(`${handlersDir}/${handler}`)(client)
    })

    await client.login(process.env.TOKEN)
})();
