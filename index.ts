const start_tick = new Date().getTime()
const DISABLE_DISCORDLOGIN = false //does not login the discord client

import { ActivityType, Client, Collection, Events, IntentsBitField, Partials, REST, Routes } from "discord.js"
import { MemoryCache, caching } from "cache-manager"
import express from "express"
import dotenv from "dotenv"
import fs from "fs"
import cors from "cors"
import mariadb from "mariadb"
import Config from "./config"
import Utils from "./modules/Utils"
import Command, { command } from "./modules/Command"
import StatusDisplayController from "./modules/StatusDisplay/Controller"
import { Cache, FileSystemCache } from "file-system-cache"
import { gzipSync } from "zlib";
import Database from "./modules/Database/Database"
import { ServiceOutage } from "./modules/StatusDisplay/Types"

const app = express()
dotenv.config()

const config = new Config()
const command = new Command()
const utils = new Utils()
const statusDisplayController = new StatusDisplayController()
const env = process.argv[2] || "prod"
let cache: MemoryCache
let file_cache: FileSystemCache

const slashCommands = new Collection()

const discordREST = new REST({ version: '10' }).setToken(process.env[env == "prod" ? "DISCORD_TOKEN" : "DISCORD_TOKEN_DEV"]);
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

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

async function RegisterSlashCommands(path: string, files: string[]) {
    const _commands = [];

    for (const file of files) {
        try {
            const command_data = require(`${path}/${file}`).command;
            _commands.push(command_data.data.toJSON());

            slashCommands.set(command_data.data.name, command_data)
        } catch (error) {
            console.error(`[Slash Command Loader]: Error loading ${file} | ${error}`);
        }
    }

    try {
        await discordREST.put(
            Routes.applicationCommands(process.env[env == "prod" ? "CLIENT_ID" : "CLIENT_ID_DEV"]),
            { body: _commands }
        );
        console.log('> slash commands registered');
    } catch (error) {
        console.error('Failed to register commands:', error);
    }
}

client.once(Events.ClientReady, async () => {
    statusDisplayController.init()

    // register commands
    const commands: any = new Collection()
    command.commands = commands

    fs.readdir(`${process_path}/commands`, (err, files) => {
        if (err) return console.error(err)
        files.forEach(file => {
            try {
                file = file.replace(/\.\w+/gm, ".js")
                const command_path = `${process_path}/dist/commands/${file}`

                if (fs.lstatSync(command_path).isDirectory()) {
                    RegisterSlashCommands(command_path, fs.readdirSync(command_path))
                } else {
                    const cmd_node = require(command_path)
                    const cmd: command = new cmd_node()

                    commands.set(cmd.name[0], cmd)
                }
            } catch (error) {
                console.error(`[Command Loader]: Unable to initialize ${file} | ${error}`)
            }
        })
    })
})

client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.channelId == statusDisplayController.statusChannel.id) { return await message.delete().catch(console.error) }
        //if (NoHello(message)) return;
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

            await command.handleCommand({
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
            })
        })
    } catch (error) {
        console.error(error)
    }
})

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    const _command: any = slashCommands.get(interaction.commandName)
    if (_command) {
        try {
            await _command.callback(interaction)
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error executing command!', ephemeral: true });
        }
    }
})

app.listen(process.env.PORT, async () => {
    cache = await caching("memory")
    await cache.set("stats_session_ids", [])
    file_cache = new Cache({
        basePath: "./.cache",
        ttl: Infinity,
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
app.get("/", async (req, res) => res.sendStatus(200));

// TODO: get botstats and cmdstats from database since its not saved in file cache anymore (why not do it now? too lazy)
app.get("/api/v1/cache/:name", async (req, res) => {
    const session_ids: Array<any> = await cache.get("stats_session_ids")
    if (session_ids && session_ids.includes(req.query.session) || env === "dev") {
        const cacheValue = await file_cache.getSync(req.params.name)
        try {
            if (req.params.name === "status_display") return res.json(statusDisplayController);
            if (!cacheValue) return res.sendStatus(404)
            return res.setHeader("content-encoding", "gzip").send(Buffer.from(cacheValue, "base64"))
        } catch (error) {
            console.error(error)
            return res.setHeader("content-encoding", "").json(cacheValue)
        }
    }
    return res.status(401).json({ code: 401, message: "Unauthorized", error: "Invalid session id" })
});

app.get("/outagelog", (req, res) => {
    res.sendFile(process_path + "/static/outageLog/index.html")
})

app.get("/outagelog/logs", async (req, res) => {
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
    statusDisplayController, command, utils,
    client, config, env, cache, file_cache, cacheValues, pool,
    start_tick
}
