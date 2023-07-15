const start_tick = new Date().getTime()

import { Client, IntentsBitField } from "discord.js"
import { MemoryCache, caching } from "cache-manager"
import express from "express"
import dotenv from "dotenv"
import fs from "fs"
import Config from "./config"
import Command from "./modules/Command"
import Debug from "./modules/Debug"
import Embed from "./modules/Embed"
import StatusDisplay from "./modules/StatusDisplay"

const app = express()
dotenv.config()

const config = new Config()
const command = new Command()
const statusDisplay = new StatusDisplay()
const env = process.argv[2]
let cache: MemoryCache

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
})

client.on("ready", async () => {
    const servers = client.guilds.cache.size

})

client.on("messageCreate", async (message) => {
    if (message.author.bot) return
    if (!message.content) return
    try {

    } catch (error) {
        console.error(error)
    }
})

app.listen(process.env.PORT, async () => {
    cache = await caching("memory")
    await cache.set("debug", [])
    client.on("debug", async (m) => await Debug(m))
    client.on("error", async (m) => await Debug(m))

    console.log(`> express server listening on port ${process.env.PORT}`)
    await client.login(process.env[env == "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]).then(async () => {
        console.log(`> logged in as ${client.user.username}.`)
        await statusDisplay.init()
    })
    console.log(`> programm initalized in ${new Date().getTime() - start_tick}ms`)

})

app.get("/api/discord/client/debug", async (req, res) => res.json(await cache.store.mget("debug")))

export {
    client,
    config,
    cache,
    Debug,
    env
}