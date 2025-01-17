import {Client} from "discord.js";
import {readdirSync} from "fs";
import {join} from "path";
import {color} from "../functions";
import {BotEvent} from "../types";

module.exports = (client: Client) => {
    let eventsDir = join(__dirname, "../events")
    let files = readdirSync(eventsDir);

    files.forEach(file => {
        if (!file.endsWith(".js")) return;
        let event: BotEvent = require(`${eventsDir}/${file}`).default
        event.once ?
            client.once(event.name, (...args) => event.execute(...args))
            :
            client.on(event.name, (...args) => event.execute(...args))
    });

    console.log(color("text", `🔥 Successfully loaded ${color("variable", files.length)} event(s)`));

}
