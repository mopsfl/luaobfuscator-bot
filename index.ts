const start_tick = new Date().getTime()
const DISABLE_DISCORDLOGIN = false //does not login the discord client

import { ActivityType, ChannelType, Client, Collection, Events, IntentsBitField, Message, MessageMentions, Partials, ThreadOnlyChannel } from "discord.js"
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
import { createClient, RedisClientType } from "redis"
import { gzipSync } from "zlib";
import RedisClient from "./modules/RedisClient"
import ForumSyncTest, { ForumThread } from "./modules/ForumSyncTest"

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

let redisClient: RedisClient = null
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
            try {
                file = file.replace(/\.\w+/gm, ".js")
                const cmd_node = require(`${process_path}/dist/commands/${file}`)
                const cmd: command = new cmd_node()
                commands.set(cmd.name[0], cmd)
            } catch (error) {
                console.error(`[Command Loader]: Unable to initialize ${file} | ${error}`)
            }
        })
    })


    // statusDisplay recursion
    const actionRecursion = async () => {
        await action_updateStats().then((res) => {
            setTimeout(actionRecursion, 100)
        })
    }; actionRecursion()
})

client.on(Events.MessageCreate, async (message) => {
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
    //redisClient = new RedisClient()
    //await redisClient.Init().catch(console.error)

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
app.get("/api/v1/statusdisplay/status/:name", (req, res) => {
    if (!statusDisplay.last_responses[req.params.name]) return res.status(404).json({ code: 404, message: `Service status '${req.params.name}' not found.` })
    res.json(statusDisplay.last_responses[req.params.name])
})
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

client.on(Events.ThreadCreate, async (thread, newlyCreated) => await ForumSyncTest.HandleNewThread(thread, newlyCreated))
client.on(Events.ThreadDelete, async (thread) => await ForumSyncTest.HandleDeletedThread(thread))
client.on(Events.MessageCreate, async (message) => await ForumSyncTest.HandleNewThreadMessage(message))
client.on(Events.MessageDelete, async (message) => await ForumSyncTest.HandleDeletedThreadMessage(message))

app.get("/api/dev/forum/threads/:channelId", async (req, res) => {
    const [data, success, cached] = await ForumSyncTest.FetchForumData(req.params.channelId)
    if (!success) return res.status(400).json(data)

    // just do all the html rendering stuff and shit
    if (!(data instanceof Array)) return res.status(400).json({ message: "Invalid thread." })

    let htmlStuff = ``
    data.forEach((thread: ForumThread) => {
        htmlStuff += `<a class="threaditem" href="/api/dev/forum/threads/${req.params.channelId}/${thread.id}">
        <img src="${thread.author.avatarURL}"></img>
        <div>
            <h3>${thread.name}</h3>
            <p><span>${thread.author.username}</span> <span>${new Date(thread.createdTimestamp).toLocaleTimeString()}</span></p>
        </div>
        </a>`
    })

    res.setHeader("X-Cached-Threads", cached ? "1" : "0").setHeader("content-type", "text/html; charset=utf-8")
    return res.send(`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forum Sync Test</title>
    <style>
        body { background: #1c1c1c }

        .container {
            margin: 1em 20%;
            display: grid;
            gap: 5px
        }

        .threaditem {
            background: #444;
            color: white;
            padding: 10px;
            font-family: Arial;
            text-decoration: none;
            display: flex;
            align-items: center;
        }

        img { width: 50px; height: 50px; margin-right: 10px }

        .threaditem > div > h3 { margin: 0; }
        .threaditem > div > p { margin: 0; margin-top: 10px }
        .threaditem > div > p > span {
            background: #2d2d2d;
            padding: 3px;
            border-radius: 3px;
        }
    </style>
</head>

<body>
<div class="container">
${htmlStuff}
</div>
</body>

</html>`)
});

app.get("/api/dev/forum/threads/:channelId/:threadId", async (req, res) => {
    const [data, success, cached] = await ForumSyncTest.FetchForumData(req.params.channelId)
    if (!success) return res.status(400).json(data)

    // just do all the html rendering stuff and shit
    if (!(data instanceof Array)) return

    let htmlStuff = ``
    const thread: ForumThread = data.find((thread: ForumThread) => thread.id === req.params.threadId)
    if (!thread) return res.status(404).json({ message: "Thread not found." })

    thread.messages.forEach(msg => {
        if (msg.id === thread.firstMessage?.id) return // dont use first message as a reply since its the thread init message
        htmlStuff += `<div class="threaditem grid">
            <div class="threaditem-author">
                <img src="${msg.author.avatarURL}"></img>
                <div>
                    <p><span>${msg.author.username}</span> <span>${new Date(msg.createdTimestamp).toLocaleTimeString()}</span></p>
                </div>
            </div>
            <span>${msg.content.replaceAll(/\n/g, "<br>")}</span>
        </div>`
    })
    res.setHeader("X-Cached-Threads", cached ? "1" : "0").setHeader("content-type", "text/html; charset=utf-8")
    return res.send(`<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Forum Sync Test</title>
            <style>
                body { background: #1c1c1c }

                .grid { display: grid !important }
        
                .container {
                    margin: 1em 20%;
                    display: grid;
                    gap: 5px
                }

                .threaditem {
                    background: #444;
                    color: white;
                    padding: 10px;
                    font-family: Arial;
                    text-decoration: none;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .threaditem.grid > span {
                    margin-top: 10px
                }

                .break {
                    flex-basis: 100%;
                    height: 0;
                    margin-top: 20px;
                }

                img { width: 50px; height: 50px; margin-right: 10px }

                .threaditem > div > p, .threaditem > div > h3 { margin: 0 }
                .threaditem > div > h3 { margin: 0; }
                .threaditem > div > p { margin: 0; margin-top: 10px }
                .threaditem > div > p > span, 
                .threaditem-author > div > p > span{
                    background: #2d2d2d;
                    padding: 3px;
                    border-radius: 3px;
                }

                .threaditem-author {
                    display: flex;
                }
            </style>
        </head>
        
        <body>
        <div class="container">
        <a class="threaditem">
            <img src="${thread.author.avatarURL}"></img>
            <div class="threaditem-author grid">
                <h3>${thread.name}</h3>
                <p><span>${thread.author.username}</span> <span>${new Date(thread.createdTimestamp).toLocaleTimeString()}</span></p>
            </div>
            <div class="break"></div>
            <span>${thread.firstMessage.content}</span>
        </a>
        ${htmlStuff}
        </div>
        </body>
        
        </html>`)
})

export interface Bot_Settings {
    alert_pings: boolean
}

export {
    Debug, statusDisplay, command, utils, obfuscatorStats, userPluginSaves,
    client, config, env, cache, file_cache, cacheValues, redisClient,
    start_tick
}
