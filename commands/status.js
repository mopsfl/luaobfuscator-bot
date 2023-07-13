const { createEmbed } = require("../utils/embed.js")
const { Colors } = require("discord.js")
const { fetchJSON } = require("../utils/misc.js")
const config = require("../.config")
const { createStatusEmbed } = require("../utils/status.js")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "status",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg
        if (!message) return

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

        const server_uptime = new Date().getTime() - new Date(server_stats.start_time).getTime()
        message.reply({
            embeds: [await createStatusEmbed(homepage_res, forum_res, api_res, server_stats, server_uptime, pings)]
        })
    }
}