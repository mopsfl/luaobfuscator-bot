const {
    Client,
    GatewayIntentBits,
    ActivityType,
    Partials,
    Colors,
    Collection,
    bold,
    inlineCode,
    codeBlock,
    formatEmoji
} = require("discord.js"),
    config = require("./.config.js"),
    fs = require("fs"),
    express = require("express"),
    app = express()

require("dotenv").config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
    fetchAllMembers: false
})

client.commands = new Collection()

fs.readdir("./commands", (err, files) => {
    if (err) throw err;

    files.forEach(f => {
        try {
            const props = require(`./commands/${f}`)
            client.commands.set(props.command, props)
            props.aliases?.forEach(alias => {
                if (typeof alias == "string") client.commands.set(alias, props)
            })
        } catch (e) { console.error(e) }
    })
})

const { create } = require("domain")
const commandFunctions = require("./utils/command"),
    { createEmbed } = require("./utils/embed"),
    { getEmoji, formatUptime, countMembers, fetchJSON, bytesToMegabytes, formatBytes } = require("./utils/misc.js")

client.on("ready", async () => {
    const servers = client.guilds.cache.size

    /*client.channels.cache.get("1128995128745402468").send({
        embeds: [createEmbed({
            title: "Lua Obfuscator - Service Status",
            description: "All statuses of luaobfuscator services displayed.",
            color: Colors.Green,
            fields: [
                { name: "**Website**", value: codeBlock("OK (200)") }
            ]
        })]
    })*/

    setInterval(() => {
        const i = Math.floor(Math.random() * config.activities.length)
        client.user.setPresence({
            activities: [{
                name: `${config.activities[i]}`,
                type: ActivityType.Watching
            }],
            status: `${config.activities[i]}`
        })
    }, config.activity_update_interval || 5000)
    console.log(`Successfully logged in as ${client.user.tag}!\nListening to ${servers} servers.`)
    console.log("status displaying started...")

    const status_channel = client.channels.cache.get("1128995128745402468")
    let last_statusupdate = new Date().getTime()

    //status
    setInterval(async () => {
        const start_tick = new Date().getTime()

        const pings = {
            api: 0,
            homepage: 0,
            forum: 0,
            server: 0
        }

        const server_stats = await fetchJSON(config.SERVER_STATS_URL); pings.server = Math.round(new Date().getTime() - start_tick)
        const homepage_res = await fetch(config.WEBSITE_URL).catch(err => console.error(err)); pings.homepage = Math.round(new Date().getTime() - start_tick)
        const forum_res = await fetch(config.FORUM_URL).catch(err => console.error(err)); pings.forum = Math.round(new Date().getTime() - start_tick)
        const api_res = await fetch(config.API_URL, { method: "POST" }).catch(err => console.error(err)); pings.api = Math.round(new Date().getTime() - start_tick)


        await status_channel.messages.fetch("1128997522917040169").then(async (msg) => {
            msg.edit({
                embeds: [
                    createEmbed({
                        title: "Lua Obfuscator - Service Status",
                        description: `All statuses of Lua Obfuscator services displayed.\n\nLast updated: <t:${Math.round(new Date().getTime() / 1000)}:R>`,
                        color: Colors.Green,
                        thumbnail: config.ICON_URL,
                        fields: [
                            {
                                name: `${getEmoji("website")} **Website:**`,
                                value: `
                            > **Homepage**: ${homepage_res.status == 200 ? "Online" : "Offline"} ${homepage_res.status == 200 ? getEmoji("online") : getEmoji("offline")} ${inlineCode(`(${homepage_res.statusText} - ${homepage_res.status} | ${pings.homepage}ms)`)}
                            > **Forum**: ${forum_res.status == 200 ? "Online" : "Offline"} ${forum_res.status == 200 ? getEmoji("online") : getEmoji("offline")} ${inlineCode(`(${forum_res.statusText} - ${forum_res.status} | ${pings.forum}ms)`)}
                            > **API**: ${api_res.status == 200 ? "Online" : "Offline"} ${api_res.status == 200 ? getEmoji("online") : getEmoji("offline")} ${inlineCode(`(${api_res.statusText} ${api_res.status} | ${pings.api}ms)`)}
                            ` },
                            {
                                name: `${getEmoji("discord")} **Discord:**`,
                                value: `
                            > **Bot Status**: ${client.uptime > 0 ? "Online" : "Offline"} ${client.uptime > 0 ? getEmoji("online") : getEmoji("offline")}
                            > **Bot Uptime**: ${inlineCode(formatUptime(client.uptime) || "error")}
                            > **Members**: ${inlineCode(await countMembers(client) || "error")}
                                `
                            },
                            {
                                name: `${getEmoji("server")} **Lua Obfuscator - Server:**`,
                                value: `
                            > **Ping**: ${inlineCode(pings.server || "error")}
                            > **Memory Usage**: ${inlineCode(formatBytes(server_stats?.memory_usage || "error") || "error")}
                                `
                            },
                            {
                                name: `${getEmoji("server")} **Bot Hosting - Server:**`,
                                value: `
                            > **Memory Usage**: ${inlineCode(formatBytes(process.memoryUsage().heapUsed || "error") || "error")}
                                `
                            }
                        ],
                        footer: {
                            text: "Lua Obfuscator - Service Status • by mopsfl"
                        }
                    })
                ]
            })
            last_statusupdate = new Date().getTime()
            console.log(`status display update. (${last_statusupdate})`)
        }).catch(err => console.error(err))
    }, config.status_update_interval);
})

client.on("messageCreate", async (message) => {
    if (message.author.bot) return
    if (!message.content) return
    try {
        if (commandFunctions.isCommand(message)) {
            const command = {
                cmd: commandFunctions.getCommand(message),
                args: commandFunctions.getArgs(message),
                rawargs: commandFunctions.getRawArgs(message),
                props: commandFunctions.getProps(message),
                message: message,
            }
            //temp
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            if (command.cmd == "obf") return message.reply(`no, use website: ${bold("https://luaobfuscator.com")} ${getEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
            //main
            if (message.guild == null && !command?.props?.allow_dm || !command.props?.enabled) return
            if (config.ignored_guilds.includes(message.guild?.id)) {
                let error_embed = createEmbed({
                    description: `${getEmoji("failed")} Commands are disabled for this guild.`,
                    color: Colors.Red,
                })
                message.reply({ embeds: [error_embed] })
                return
            }
            if (command.props.required_permissions) {
                let allowed = false
                for (let i = 0; i < command.props.required_permissions.length; i++) {
                    const permission_bit = command.props.required_permissions[i];
                    if (commandFunctions.hasPermission(message.member, permission_bit)) allowed = true
                }
                if (!allowed) {
                    let embed = createEmbed({
                        title: `${getEmoji("failed")} Missing Permissions`,
                        color: Colors.Red,
                        description: "You are not allowed to use this command.",
                        timestamp: true,
                    })
                    message.reply({ embeds: [embed] })
                    return
                }
            }
            let arg_length = command.props.arguments.length == 0 ? 0 : command.props.min_args || 0
            if (((command.args.length - 1) > arg_length || (command.args.length - 1) < arg_length) && (command.args.length - 1 < command.props.max_args) && !command.props.ignore_arguments) {
                let usage_args = command.props.arguments.length > 0 ? "`" + `${command.props.arguments}` + "`" : ""
                let usage_cmd = "`" + `${config.prefix}${command.cmd}` + "`"
                let embed = createEmbed({
                    title: `${getEmoji("failed")} Syntax Error`,
                    color: Colors.Red,
                    fields: [{
                        name: "Syntax:",
                        value: `${usage_cmd} ${usage_args}`,
                        footer: {
                            text: "LuaObfuscator Bot • made by mopsfl#4588",
                            iconURL: config.ICON_URL
                        }
                    }],
                    timestamp: true
                })
                message.reply({ embeds: [embed] })
                return
            }
            const begin_time = Date.now()
            command.props.callback(command).then(() => {
                console.log(`'${command.cmd}' command, requested by ${message.author.tag}, finished in ${(Date.now() - begin_time)}ms`)
            })
        } else if (commandFunctions.isBotMention(message)) {
            const helpCommand = client.commands.find(cmd => cmd.command == "help")
            if (helpCommand) helpCommand.callback(message)
        }
    } catch (e) {
        console.error(e)
    }
})

try {
    client.login(process.env.TOKEN).then(() => {
        global.client = client
    }).catch(console.error)
} catch (e) {
    console.error(e)
}

app.get("/", (req, res) => {
    res.status(200).json({ code: 200, message: "OK" })
})

app.get("/client/uptime", (req, res) => {
    res.status(200).json({ ms: client.uptime, time: formatUptime(client.uptime) })
})

app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`)
})