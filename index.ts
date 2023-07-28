const start_tick = new Date().getTime()
const DISABLE_DISCORDLOGIN = false

import { Client, Collection, Constructable, IntentsBitField } from "discord.js"
import { MemoryCache, caching } from "cache-manager"
import express from "express"
import dotenv from "dotenv"
import fs from "fs"
import cors from "cors"
import path from "path"
import Config from "./config"
import Command, { cmdStructure, command } from "./modules/Command"
import Debug from "./modules/Debug"
import Embed from "./modules/Embed"
import Session from "./modules/Session"
import StatusDisplay from "./modules/StatusDisplay"
import ChartImage from "./modules/ChartImage"
import { Cache, FileSystemCache } from "file-system-cache"

const app = express()
dotenv.config()

const config = new Config()
const command = new Command()
const session = new Session()
const statusDisplay = new StatusDisplay()
const chartImage = new ChartImage()
const env = process.argv[2]
let cache: MemoryCache
let file_cache: FileSystemCache

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
})

client.on("ready", async () => {
    const process_path = process.cwd()
    await statusDisplay.init()
    await statusDisplay.UpdateDisplayStatus()
    const action_updateStats = () => new Promise((resolve, reject) => {
        return setTimeout(async () => {
            console.log(`> updating status display... (last update: ${Math.round((new Date().getTime() - statusDisplay.last_statusupdate) / 1000)} seconds ago)`)
            await statusDisplay.UpdateDisplayStatus()
            //@ts-ignore
            resolve();
        }, config.status_update_interval)
    })

    //command register
    const commands: any = new Collection()
    command.commands = commands
    fs.readdir(`${process_path}/commands`, (err, files) => {
        if (err) return Debug(err, true)
        files.forEach(file => {
            file = file.replace(".ts", ".js")
            const cmd_node = require(`${process_path}/dist/commands/${file}`)
            const cmd: command = new cmd_node()
            commands.set(cmd.name, cmd)
        })
    })

    const actionRecursion = async () => {
        await action_updateStats().then(() => {
            setTimeout(actionRecursion, 100)
        })
    }

    actionRecursion()
})

client.on("messageCreate", async (message) => {
    try {
        if (message.channelId == statusDisplay.status_message.channelId) { await message.delete(); return }
        if (message.author.bot || !message.content || !message.content.startsWith(config.prefix)) return

        const _command = command.getCommand(message)?.replace(/```[^`]*```/gm, "").trim(),
            _args: Array<number | string> = command.getArgs(message).splice(1)
        command.commands.forEach(async c => {
            if (typeof (c.name) == "object" && !c.name.includes(_command) || typeof (c.name) == "string" && c.name != _command) return
            const cmd: cmdStructure = {
                prefix: config.prefix,
                name: c.name,
                arguments: _args,
                id: command.createCommandId(),
                callback: c.callback,
                message: message,
                timestamp: new Date().getTime(),
                success: false
            }

            let allowed = false
            for (let i = 0; i < c.permissions?.length; i++) {
                const permission_bit = c.permissions[i];
                if (command.hasPermission(message.member, permission_bit)) allowed = true
            }

            await command.handleCommand(cmd)
        })
        /* command handler soon (this is just temp)
        const updatestatus_command = updatestatus(message)
        const cache_command = cachecommand(message)
        const clearcache_command = clrcachecommand(message)


        if (_command == updatestatus_command.command || updatestatus_command.aliases.includes(_command)) {
            const start_tick = new Date().getTime()
            if (updatestatus_command.required_permissions) {
                let allowed = false
                for (let i = 0; i < updatestatus_command.required_permissions.length; i++) {
                    const permission_bit = updatestatus_command.required_permissions[i];
                    if (command.hasPermission(message.member, permission_bit)) allowed = true
                }
                if (!allowed) {
                    let embed = Embed({
                        title: `${GetEmoji("no")} Missing Permissions`,
                        color: Colors.Red,
                        description: "You are not allowed to use this command.",
                        timestamp: true,
                    })
                    message.reply({ embeds: [embed] })
                    return
                }
                await updatestatus_command.callback()
            }
            console.log(`> command '${_command}' requested by ${message.author.username}. (took ${new Date().getTime() - start_tick}ms)`)
        } else if (["obf", "obfuscate"].includes(_command)) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS", "skibidi_toilet", "Angry", "pepe_cringe", "pepewow", "aquacry"]
            await message.reply(`no, use website: ${bold("https://luaobfuscator.com")} ${GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
        } else if (_command == cache_command.command || cache_command.aliases.includes(_command)) {
            const start_tick = new Date().getTime()
            if (cache_command.required_permissions) {
                let allowed = false
                for (let i = 0; i < cache_command.required_permissions.length; i++) {
                    const permission_bit = cache_command.required_permissions[i];
                    if (command.hasPermission(message.member, permission_bit)) allowed = true
                }
                if (!allowed) {
                    let embed = Embed({
                        title: `${GetEmoji("no")} Missing Permissions`,
                        color: Colors.Red,
                        description: "You are not allowed to use this command.",
                        timestamp: true,
                    })
                    message.reply({ embeds: [embed] })
                    return
                }
                await cache_command.callback()
            }
            console.log(`> command '${_command}' requested by ${message.author.username}. (took ${new Date().getTime() - start_tick}ms)`)
        } else if (_command == clearcache_command.command || clearcache_command.aliases.includes(_command)) {
            const start_tick = new Date().getTime()
            if (clearcache_command.required_permissions) {
                let allowed = false
                for (let i = 0; i < clearcache_command.required_permissions.length; i++) {
                    const permission_bit = clearcache_command.required_permissions[i];
                    if (command.hasPermission(message.member, permission_bit)) allowed = true
                }
                if (!allowed) {
                    let embed = Embed({
                        title: `${GetEmoji("no")} Missing Permissions`,
                        color: Colors.Red,
                        description: "You are not allowed to use this command.",
                        timestamp: true,
                    })
                    message.reply({ embeds: [embed] })
                    return
                }
                await clearcache_command.callback()
            }
            console.log(`> command '${_command}' requested by ${message.author.username}. (took ${new Date().getTime() - start_tick}ms)`)
        } else if (_command == "test") {
            const datasets_obfuscation_stats: Array<ChartDataset> = [{ "label": "Daily Obfuscations", "data": args.splice(1), "fill": true, "backgroundColor": "rgba(54, 162, 235, 0.8)" }]
            const chart_obfuscation_stats = chartImage.Create({
                type: args[0].toString(),
                data: {
                    labels: chartImage.GetLocalizedDateStrings(),
                    datasets: datasets_obfuscation_stats
                }
            }).height("600").width("1000").bkg("rgb(255,255,255)").toURL()
            message.reply({
                embeds: [
                    Embed({
                        title: "Lua Obfuscator - Statistics",
                        color: Colors.Green,
                        thumbnail: config.icon_url,
                        description: `Live statistics of Lua Obfuscator.`,
                        timestamp: true
                    }).setImage(chart_obfuscation_stats).setURL(chart_obfuscation_stats),
                ],
            })
        }*/
    } catch (error) {
        console.error(error)
    }
})

app.listen(process.env.PORT, async () => {
    cache = await caching("memory")
    await cache.set("debug", [])
    await cache.set("stats_session_ids", [])
    await cache.set("command_log", [])
    file_cache = new Cache({
        basePath: "./.cache",
        ttl: Infinity,
    })
    fs.readdir(process.cwd() + "/.cache/charts", (err, files) => {
        if (err) throw err
        files.forEach(f => {
            fs.unlink(path.join(process.cwd() + "/.cache/charts", f), (err) => {
                if (err) throw err
            })
        })
    })

    client.on("debug", async (m) => await Debug(m))
    client.on("error", async (m) => await Debug(m))

    console.log(`> express server listening on port ${process.env.PORT}\n> logging in...`)
    DISABLE_DISCORDLOGIN && console.log("> discord login blocked")
    !DISABLE_DISCORDLOGIN && await client.login(process.env[env == "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]).then(async () => {
        console.log(`> logged in as ${client.user.username}`)
    })
    console.log(`> programm initalized in ${new Date().getTime() - start_tick}ms`)

    if (!file_cache.getSync("last_outage")) file_cache.setSync("last_outage", { time: "N/A", affected_services: [] })
    if (!file_cache.getSync("outage_log")) file_cache.setSync("outage_log", { outages: [] })
})

app.use(cors())
app.use((req, res, next) => {
    res.removeHeader("X-Powered-By")
    next()
})

app.get("/api/discord/client/debug", async (req, res) => res.json(await cache.get("debug")))
app.get("/api/discord/client/command-logs", async (req, res) => res.json(await cache.get("command_log")))
app.get("/api/luaobfuscator/stats/last-outage", async (req, res) => {
    const session_ids: Array<any> = await cache.get("stats_session_ids")
    if (session_ids && session_ids.includes(req.query.session)) return res.json(await file_cache.getSync("last_outage"))
    return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })
})
app.get("/api/luaobfuscator/stats/outage-log", async (req, res) => {
    const session_ids: Array<any> = await cache.get("stats_session_ids")
    if (session_ids && session_ids.includes(req.query.session)) return res.json(await file_cache.getSync("outage_log"))
    return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })
})

app.get("/api/chart", async (req, res) => {
    try {
        if (!req.query.datasets) return res.status(400).json({ code: 400, message: "Bad Request" })
        const chart = chartImage.Create({
            type: req.query.type?.toString() || "line",
            data: {
                labels: chartImage.GetLocalizedDateStrings(),
                datasets: JSON.parse(req.query.datasets.toString())
            }
        })
        const chart_id = (await session.Create()).toString()
        const buffer = await chart.toBuffer()
        if (await cache.get(buffer.toString())) {
            const cached_chart = await cache.get(buffer.toString())
            res.setHeader("X-Cached-Chart", "true")
            return res.sendFile(process.cwd() + `/.cache/charts/${cached_chart}.png`)
        } else {
            await cache.set(buffer.toString(), chart_id)
            //@ts-ignore
            await chart.toFile(`./.cache/charts/${chart_id}.png`)
            res.setHeader("X-Cached-Chart", "false")
            return res.sendFile(process.cwd() + `/.cache/charts/${chart_id}.png`)
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ code: 500, message: "Internal Server Error", error: error })
    }
})

export {
    Embed, Debug,
    statusDisplay, command, session,
    client, config, env, cache, file_cache,
    start_tick
}