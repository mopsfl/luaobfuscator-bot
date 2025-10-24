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
import Session from "./modules/Misc/Session"
import ObfuscatorStats from "./modules/ObfuscatorStats"
import Chart from "./modules/StatusDisplay/Chart"

const DISABLE_DISCORDLOGIN = false
const START_TIME = Date.now()
const ENV = process.argv[2] || "prod"
const PROCESS_PATH = process.cwd()
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
                name: "DM me !obfuscate",
                type: ActivityType.Playing,
            }],
        },
    });


client.once(Events.ClientReady, async () => statusDisplayController.init())
client.on(Events.MessageCreate, commandHandler.OnMessageCreate.bind(commandHandler));
client.on(Events.InteractionCreate, commandHandler.OnInteractionCreate.bind(commandHandler))

app.listen(process.env.PORT, async () => {
    cache = await caching("memory")

    console.log(`> server listening on port ${process.env.PORT}`)

    if (!DISABLE_DISCORDLOGIN) {
        let _time = Date.now()
        console.log("> logging in discord client...");
        await client.login(process.env[ENV == "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]).then(async () => {
            console.log(`> logged in as ${client.user.username} (took ${Date.now() - _time}ms)`)
        })
        await commandHandler.RegisterCommands()
    } else console.log("> skipped discord login (DISABLE_DISCORDLOGIN = true)")

    console.log(`> programm initalized in ${Date.now() - START_TIME}ms (enviroment: ${ENV})`)
})

app.use(cors())
app.get("/", async (req, res) => res.sendStatus(200));
app.get("/outagehistory", (req, res) => res.sendFile(PROCESS_PATH + "/static/outagehistory/index.html"))
app.get("/api/outagehistory/logs", async (req, res) => {
    if (!req.query.s && ENV !== "dev") return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })

    Session.Get(req.query.s?.toString()).then(async session => {
        if (!session && ENV !== "dev" && ENV !== "dev") return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })

        const limit = req.query.limit ? parseInt(req.query.limit.toString()) : null
        const result = await Database.GetTable("outage_log", null, null, limit, true)
        const outages = result.data?.map((outage: ServiceOutage) => ({
            time: outage.time,
            services: (() => {
                try {
                    return JSON.parse(outage.services?.toString() ?? "[]");
                } catch { return [] }
            })(),
            identifier: outage.identifier,
            oid: outage.oid,
            end: outage.end
        }));

        res.json(outages);
    })

})

app.get("/api/session/:session", async (req, res) => {
    try {
        const session = await Session.Get(req.params.session)
        res.status(session ? 200 : 404).json(session ?? { code: 404, message: "Not Found", error: "unknown session id" })
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.post("/api/session/create", async (req, res) => {
    try {
        if (ENV !== "dev") return res.sendStatus(409)
        const session = await Session.CreateV2(300)
        res.json(session)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get("/api/statistics/", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 7
        return res.json(await ObfuscatorStats.Parse(limit))
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get("/api/statistics/raw", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 7
        return res.json((await ObfuscatorStats.Get()).slice(-limit))
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get("/api/statistics/chart", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 7
        return res.redirect(Chart.Create(await ObfuscatorStats.Parse(limit), limit).toString())
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

app.get("/api/commands", async (req, res) => {
    try {
        const commands = JSON.parse(JSON.stringify({
            chat_commands: Object.fromEntries(commandHandler.commands),
            slash_commands: Object.fromEntries(commandHandler.slash_commands),
        }, (_, value) => typeof value === "bigint" ? value.toString() : value))

        res.json(commands)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
});

app.get("/api/status", async (req, res) => {
    return res.json({
        lastOutage: statusDisplayController.lastOutage,
        lastResult: Object.fromEntries(statusDisplayController.statusResults)
    })
})

app.get("/api/database/usersaves", async (req, res) => {
    Session.Get(req.query.s?.toString()).then(async session => {
        if (!session) return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })
        const result = await Database.GetTable("customplugin_saves")

        if (!result.success) {
            return res.status(result.error.status).json({ code: result.error.status, error: result.error.sqlMessage })
        }

        return res.json(Object.fromEntries(
            (<Array<{ userid: string, plugins: string }>>result.data).map(({ userid, plugins }) => [
                userid, Object.fromEntries(Object.entries(JSON.parse(plugins)).map(([k, v]) => {
                    try { return [k, JSON.parse(v as string)] } catch { return [k, v] }
                }))
            ])
        ));
    })
})

export {
    statusDisplayController, commandHandler,
    client, ENV, cache, discordREST
}