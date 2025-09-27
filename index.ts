// TODO: new session manager (id based)

import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { MemoryCache, caching } from "cache-manager"

import {
    ActivityType,
    Client,
    Events,
    IntentsBitField,
    Partials,
    REST
} from "discord.js"

import StatusDisplayController from "./modules/StatusDisplay/Controller"
import Database from "./modules/Database/Database";
import { ServiceOutage } from "./modules/StatusDisplay/Types";
import CommandHandler from "./modules/CommandHandler";
import config from "./config";

const DISABLE_DISCORDLOGIN = false
const START_TIME = Date.now()
const ENV = process.argv[2] || "prod"
const PROCESS_PATH = process.cwd();
dotenv.config()

const app = express()
const statusDisplayController = new StatusDisplayController()
const commandHandler = new CommandHandler()
let cache: MemoryCache

const discordREST = new REST({ version: "10" }).setToken(process.env[ENV === "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]),
    client = new Client({
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.DirectMessages,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent,
        ],
        partials: [Partials.Channel],
        presence: {
            status: "online",
            activities: [{
                name: "Lua Obfuscator",
                type: ActivityType.Watching,
                url: config.STATUS_DISPLAY.endpoints.homepage,
            }],
        },
    });


client.once(Events.ClientReady, async () => statusDisplayController.init())
client.on(Events.MessageCreate, commandHandler.OnMessageCreate.bind(commandHandler));
client.on(Events.InteractionCreate, commandHandler.OnInteractionCreate.bind(commandHandler))

app.listen(process.env.PORT, async () => {
    cache = await caching("memory")
    await cache.set("stats_session_ids", [])

    console.log(`> server listening on port ${process.env.PORT}`)

    if (!DISABLE_DISCORDLOGIN) {
        let _time = Date.now()
        console.log("> logging in discord client...");
        await client.login(process.env[ENV == "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]).then(async () => {
            console.log(`> logged in as ${client.user.username} (took ${Date.now() - _time}ms)`)
        })
        await commandHandler.RegisterCommands()
    } else console.log("> skipped discord login (DISABLE_DISCORDLOGIN = true)")

    console.log(`> programm initalized in ${Date.now() - START_TIME}ms`)
})

app.use(cors())
app.get("/", async (req, res) => res.sendStatus(200));
app.get("/outagehistory", (req, res) => res.sendFile(PROCESS_PATH + "/static/outagehistory/index.html"))

app.get("/outagehistory/logs", async (req, res) => {
    const session_ids: Array<any> = await cache.get("stats_session_ids")
    if (!session_ids?.includes(req.query.s)) return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })

    const result = await Database.GetTable("outage_log")
    const outages = result.data?.map((outage: ServiceOutage) => ({
        time: outage.time,
        services: (() => {
            try {
                return JSON.parse(outage.services?.toString() ?? "[]");
            } catch { return [] }
        })(),
        id: outage.id
    }));

    res.json(outages);
})

export {
    statusDisplayController, commandHandler,
    client, ENV, cache, discordREST
}
