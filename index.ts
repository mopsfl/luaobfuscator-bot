const start_tick = new Date().getTime()
const DISABLE_DISCORDLOGIN = false //does not login the discord client

import { ActivityType, Client, Collection, IntentsBitField, Partials } from "discord.js"
import { MemoryCache, caching } from "cache-manager"
import express from "express"
import dotenv from "dotenv"
import fs from "fs"
import cors from "cors"
import Config from "./config"
import Utils from "./modules/Utils"
import Command, { cmdStructure, command } from "./modules/Command"
import Debug from "./modules/Debug"
import StatusDisplay from "./modules/StatusDisplay"
import ObfuscatorStats from "./modules/ObfuscatorStats"
import UserPluginSaves from "./modules/UserPluginSaves"
import { Cache, FileSystemCache } from "file-system-cache"
import NoHello from "./modules/NoHello"
import DeobfLaugh from "./modules/DeobfLaugh"
import { gzipSync } from "zlib";

const app = express()
dotenv.config()

const config = new Config()
const command = new Command()
const utils = new Utils()
const statusDisplay = new StatusDisplay()
const obfuscatorStats = new ObfuscatorStats()
const userPluginSaves = new UserPluginSaves()
const env = process.argv[2] || "prod"
let cache: MemoryCache
let file_cache: FileSystemCache

const process_path = process.cwd()
var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

const cacheValues = {
    "last_outage": { time: "N/A", affected_services: [] },
    "outage_log": { outages: [] },
    "bot_stats": { obfuscations: 0, total_commands_executed: 0 },
    "cmd_stats": {},
    "bot_settings": { alerts: true },
    "error_logs": [],
    "customobfuscate_usersaves": {},
    "obfuscator_stats": {}
}

const client = new Client({
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
            name: `Lua Obfuscator`,
            type: ActivityType.Watching,
            url: config.STATUS_DISPLAY.endpoints.homepage,
        }]
    }
})

client.on("ready", async () => {
    await statusDisplay.init()
    await statusDisplay.UpdateDisplayStatus()

    const action_updateStats = () => new Promise((resolve, reject) => {
        return setTimeout(async () => {
            console.log(`> updating status display... (last update: ${Math.round((new Date().getTime() - statusDisplay.last_statusupdate) / 1000)} seconds ago)`)
            await statusDisplay.UpdateDisplayStatus()
            resolve(true);
        }, config.status_update_interval)
    })

    // register commands
    const commands: any = new Collection()
    command.commands = commands
    fs.readdir(`${process_path}/commands`, (err, files) => {
        if (err) return Debug(err, true)
        files.forEach(file => {
            file = file.replace(/\.\w+/gm, ".js")
            const cmd_node = require(`${process_path}/dist/commands/${file}`)
            const cmd: command = new cmd_node()
            commands.set(cmd.name[0], cmd)
        })
    })
    // statusDisplay recursion
    const actionRecursion = async () => {
        await action_updateStats().then((res) => {
            setTimeout(actionRecursion, 100)
        })
    }; actionRecursion()
})

client.on("messageCreate", async (message) => {
    try {
        if (message.channelId == statusDisplay.status_message.channelId) { await message.delete(); return }
        if (NoHello(message) || DeobfLaugh(message)) return
        if (message.author.bot || !message.content || !message.content.startsWith(config.prefix)) return
        const _command = command.getCommand(message)?.replace(/```[^`]*```/gm, "").trim(),
            _args: Array<number | string> = command.getArgs(message).splice(1)


        command.commands.forEach(async c => {
            if (typeof (c.name) == "object" && !c.name.includes(_command) || typeof (c.name) == "string" && c.name != _command) return
            if (message.channel.isDMBased() && c.direct_message == false) return console.log(`> command '${c.name}', requested by '${message.author.username}', blocked. (direct_message not allowed)`);

            let allowed = true
            for (let i = 0; i < c.permissions?.length; i++) {
                const permission_bit = c.permissions[i];
                if (command.hasPermission(message.member, permission_bit)) {
                    allowed = true
                } else allowed = false
            }

            const cmd: cmdStructure = {
                prefix: config.prefix,
                name: c.name,
                used_command_name: _command,
                arguments: _args,
                raw_arguments: command.getRawArgs(message),
                id: command.createCommandId(),
                callback: c.callback,
                message: message,
                timestamp: new Date().getTime(),
                allowed: allowed,
                success: false,
                public_command: c.public_command
            }

            await command.handleCommand(cmd)
        })
    } catch (error) {
        console.error(error)
    }
})

app.listen(process.env.PORT, async () => {
    cache = await caching("memory")
    await cache.set("stats_session_ids", [])
    file_cache = new Cache({
        basePath: "./.cache",
        ttl: Infinity,
    })

    file_cache.fileExists(obfuscatorStats.file_cache_name).then(async file => {
        if (!file) await file_cache.set(obfuscatorStats.file_cache_name, {})
    })

    console.log(`> express server listening on port ${process.env.PORT}\n> logging in...`)
    !DISABLE_DISCORDLOGIN ? await client.login(process.env[env == "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]).then(async () => {
        console.log(`> logged in as ${client.user.username}`)
    }) : console.log("> discord login blocked")
    Object.keys(cacheValues).forEach(async (n, i) => {
        const _cacheValue = await file_cache.get(n).catch(console.error)
        if (!_cacheValue) file_cache.setSync(n, Object.values(cacheValues)[i] || {})
        if (n === "outage_log" && !base64regex.test(_cacheValue)) { //@ts-ignore
            file_cache.setSync("outage_log", utils.ToBase64(gzipSync(JSON.stringify(_cacheValue))))
        }
    })

    console.log(`> programm initalized in ${new Date().getTime() - start_tick}ms`)
})

app.use(cors())
app.use((req, res, next) => { res.removeHeader("X-Powered-By"); next() })
app.get("/", async (req, res) => res.sendStatus(200));
app.get("/api/v1/obfuscator/stats", async (req, res) => res.json({
    total_obfuscations: await obfuscatorStats.ParseCurrentStat("total_obfuscations", true),
    total_file_uploads: await obfuscatorStats.ParseCurrentStat("total_file_uploads", true),
}))

app.get("/api/v1/statusdisplay/data", (req, res) => res.json(statusDisplay))
app.get("/api/v1/commands/:cmdname", (req, res) => {
    const _command: any = command.commands.get(req.params.cmdname)
    if (_command.permissions) _command.permissions.forEach((v: any, i: number) => _command.permissions[i] = utils.GetPermissionsName(v))
    if (_command.callback) _command.callback = typeof (_command.callback)
    res.json(_command)
})

app.get("/api/v1/cache/:name", async (req, res) => {
    const session_ids: Array<any> = await cache.get("stats_session_ids")
    if (session_ids && session_ids.includes(req.query.session) || env === "dev") {
        const cacheValue = await file_cache.getSync(req.params.name)
        try {
            if (req.params.name === "status_display") return res.json(statusDisplay);
            if (!cacheValue) return res.sendStatus(404)
            return res.setHeader("content-encoding", "gzip").send(Buffer.from(cacheValue, "base64"))
        } catch (error) {
            console.error(error)
            return res.setHeader("content-encoding", "").json(cacheValue)
        }
    }
    return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })
})

export interface Bot_Settings {
    alert_pings: boolean
}

export {
    Debug, statusDisplay, command, utils, obfuscatorStats, userPluginSaves,
    client, config, env, cache, file_cache, cacheValues,
    start_tick
}