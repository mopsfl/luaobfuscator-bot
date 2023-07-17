const start_tick = new Date().getTime()

import { Client, Colors, IntentsBitField, bold } from "discord.js"
import { MemoryCache, caching } from "cache-manager"
import express from "express"
import dotenv from "dotenv"
import fs, { stat } from "fs"
import Config from "./config"
import Command from "./modules/Command"
import Debug from "./modules/Debug"
import Embed from "./modules/Embed"
import StatusDisplay from "./modules/StatusDisplay"
import FormatUptime from "./modules/FormatUptime"
import updatestatus from "./commands/updatestatus"
import GetEmoji from "./modules/GetEmoji"

const app = express()
dotenv.config()

const config = new Config()
const command = new Command()
const statusDisplay = new StatusDisplay()
const env = process.argv[2]
let cache: MemoryCache

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
})

client.on("ready", async () => {
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

    const actionRecursion = async () => {
        await action_updateStats().then(() => {
            setTimeout(actionRecursion, 100)
        })
    }

    actionRecursion()
})

client.on("messageCreate", async (message) => {
    if (message.author.bot) return
    if (!message.content) return
    if (message.channelId == statusDisplay.status_message.channelId) await message.delete()
    try {
        if (!message.content.startsWith(config.prefix)) return
        //command handler not done
        const updatestatus_command = updatestatus(message)
        const _command = command.getCommand(message).replace(/```[^`]*```/gm, "").trim()

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
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            await message.reply(`no, use website: ${bold("https://luaobfuscator.com")} ${GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
        }
    } catch (error) {
        console.error(error)
    }
})

app.listen(process.env.PORT, async () => {
    cache = await caching("memory")
    await cache.set("debug", [])
    client.on("debug", async (m) => await Debug(m))
    client.on("error", async (m) => await Debug(m))

    console.log(`> express server listening on port ${process.env.PORT}\n> logging in...`)
    await client.login(process.env[env == "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]).then(async () => {
        console.log(`> logged in as ${client.user.username}`)
    })
    console.log(`> programm initalized in ${new Date().getTime() - start_tick}ms`)
})

app.get("/api/discord/client/debug", async (req, res) => res.json(await cache.get("debug")))

export {
    Embed, Debug,
    statusDisplay, command,
    client, config, env, cache,
    start_tick
}