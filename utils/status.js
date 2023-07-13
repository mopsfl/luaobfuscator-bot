const { inlineCode, Colors } = require("discord.js")
const { formatBytes, getEmoji, formatUptime, countMembers, fetchJSON, formatNumber } = require("./misc")
const { createEmbed } = require("./embed")
const config = require("../.config")

module.exports = {
    createStatusEmbed: async function (homepage_res, forum_res, api_res, server_stats, server_uptime, pings, show_next_update = false, all_online) {
        if (!global.client) return console.error("global.client is not defined")
        return [createEmbed({
            title: "Lua Obfuscator - Service Status",
            description: `All statuses of Lua Obfuscator services displayed.${show_next_update == true ? `
            \n${getEmoji("update")} **Last Updated:** <t:${Math.round(new Date().getTime() / 1000)}:R>` : ""}
            ${getEmoji("offline")} **Last Outage:** ${global.uptime_after_outage ? `<t:${Math.round(global.last_outtage / 1000)}:R> ${inlineCode(`(~${formatUptime(global.uptime_after_outage - global.last_outtage)})`)}` : `${inlineCode("N/A")}`}`,
            color: all_online ? Colors.Green : Colors.Red,
            thumbnail: config.ICON_URL,
            timestamp: true,
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
                    > **Bot Status**: ${global.client.uptime > 0 ? "Online" : "Offline"} ${global.client.uptime > 0 ? getEmoji("online") : getEmoji("offline")}
                    > **Bot Uptime**: ${inlineCode(formatUptime(global.client.uptime) || "N/A")}
                    > **Members**: ${inlineCode(await countMembers(global.client) || "N/A")}
                    `
                },
                {
                    name: `${getEmoji("server_luaobf")} **Lua Obfuscator - Server:**`,
                    value: `
                    > **Ping**: ${inlineCode(pings.server || "N/A")}
                    > **Uptime**: ${inlineCode(formatUptime(server_uptime) || "N/A")}
                    > **Memory Usage**: ${inlineCode(formatBytes(server_stats?.memory_usage || "N/A") || "N/A")}
                    `
                },
                {
                    name: `${getEmoji("server_discord")} **Bot Hosting - Server:**`,
                    value: `
                    > **Uptime**: ${inlineCode(formatUptime(new Date().getTime() - global.server_start_tick) || "N/A")}
                    > **Memory Usage**: ${inlineCode(formatBytes(process.memoryUsage().heapUsed || "N/A") || "N/A")}
                    `
                }
            ],
            footer: {
                text: "Lua Obfuscator - Service Status • by mopsfl"
            }
        }),
        createEmbed({
            title: "Lua Obfuscator - Statistics",
            description: `Live statistics of Lua Obfuscator.${show_next_update == true ? `
            \n${getEmoji("update")} **Last Updated:** <t:${Math.round(new Date().getTime() / 1000)}:R>` : ""}`,
            color: Colors.Green,
            timestamp: true,

            fields: [
                {
                    name: `${getEmoji("logo")} **Obfusactor Statistics:**`,
                    value: `
                    > **Total Files Uploaded**: ${inlineCode(formatNumber(server_stats?.total_file) || "N/A")}
                    > **Total Obfuscations**: ${inlineCode(formatNumber(server_stats?.total_obfuscations) || "N/A")}
                    > **Obfuscations/last 1 min**: ${inlineCode(formatNumber(global.last_total_obfuscations != 0 ? server_stats?.total_obfuscations - global.last_total_obfuscations : 0) || "N/A")}
                    > **Files uploaded/last 1 min**: ${inlineCode(formatNumber(global.last_total_file != 0 ? server_stats?.total_file - global.last_total_file : 0) || "N/A")}
                    `
                }, {
                    name: `${getEmoji("upload")} **Request Queue:**`,
                    value: `
                    > **Current Requests:** ${inlineCode(server_stats?.queue_active) || inlineCode("N/A")}
                    > **Requests In Queue:** ${inlineCode(server_stats?.queue_waiting) || inlineCode("N/A")}
                    `
                },
            ]
        })]
    },

    async updateStatusMessage(start_tick) {
        if (!global.status_channel) return console.error("global.status_channel is not defined")
        if (!global.createStatusEmbed) return console.error("global.createStatusEmbed is not defined.")

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
        const server_uptime = new Date().getTime() - new Date(server_stats?.start_time).getTime() || "N/A"

        let all_online = new Array(homepage_res, forum_res, api_res).find(_res => _res.status != 200) ? false : true
        if (!all_online) {
            global.last_outtage = new Date().getTime()
        } else {
            if (global.last_outtage && !global.uptime_after_outage) global.uptime_after_outage = new Date().getTime()
        }

        await global.status_channel.messages.fetch("1128997522917040169").then(async (msg) => {
            msg.edit({
                embeds: await global.createStatusEmbed(homepage_res, forum_res, api_res, server_stats, server_uptime, pings, true, all_online)
            })
            global.last_statusupdate = new Date().getTime()
        }).catch(err => console.error(err))

        global.last_total_obfuscations = server_stats?.total_obfuscations || "N/A"
        global.last_total_file = server_stats?.total_file || "N/A"
    }
}