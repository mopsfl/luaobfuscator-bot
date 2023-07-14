const { inlineCode, Colors } = require("discord.js")
const { formatBytes, getEmoji, formatUptime, countMembers, fetchJSON, formatNumber, _fetch } = require("./misc")
const { createEmbed } = require("./embed")
const config = require("../.config")

module.exports = {
    createStatusEmbed: async function (responses, server_uptime, show_next_update = false, all_online) {
        if (!global.client) return console.error("global.client is not defined")
        return [createEmbed({
            title: "Lua Obfuscator - Service Status",
            description: `All statuses of Lua Obfuscator services displayed.${show_next_update == true ? `
            \n${getEmoji("update")} **Last Updated:** <t:${Math.round(new Date().getTime() / 1000)}:R>` : ""}
            ${getEmoji("offline")} **Last Outage:** ${global.last_outtage ? `<t:${Math.round(global.last_outtage / 1000)}:R>` : `${inlineCode("N/A")}`}`,
            color: all_online ? Colors.Green : Colors.Red,
            thumbnail: config.ICON_URL,
            timestamp: true,
            fields: [
                {
                    name: `${getEmoji("website")} **Website:**`,
                    value: `
                    > **Homepage**: ${responses.WEBSITE_URL.status == 200 ? "Online" : "Offline"} ${responses.WEBSITE_URL.status == 200 ? getEmoji("online") : getEmoji("offline")} ${inlineCode(`(${responses.WEBSITE_URL.statusText} - ${responses.WEBSITE_URL.status})`)}
                    > **Forum**: ${responses.FORUM_URL.status == 200 ? "Online" : "Offline"} ${responses.FORUM_URL.status == 200 ? getEmoji("online") : getEmoji("offline")} ${inlineCode(`(${responses.FORUM_URL.statusText} - ${responses.FORUM_URL.status})`)}
                    > **API**: ${responses.API_URL.status == 200 ? "Online" : "Offline"} ${responses.API_URL.status == 200 ? getEmoji("online") : getEmoji("offline")} ${inlineCode(`(${responses.API_URL.statusText} - ${responses.API_URL.status})`)}
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
                    > **Ping**: ${inlineCode(responses.server?.ping || "N/A")}
                    > **Uptime**: ${inlineCode(formatUptime(server_uptime) || "N/A")}
                    > **Memory Usage**: ${inlineCode(formatBytes(responses.server?.server_stats?.memory_usage || "N/A") || "N/A")}
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
                    > **Total Files Uploaded**: ${inlineCode(formatNumber(responses.server?.server_stats?.total_file) || "N/A")}
                    > **Total Obfuscations**: ${inlineCode(formatNumber(responses.server?.server_stats?.total_obfuscations) || "N/A")}
                    > **Obfuscations/last 1 min**: ${inlineCode("~" + formatNumber(global.last_total_obfuscations != 0 ? responses.server?.server_stats?.total_obfuscations - global.last_total_obfuscations : 0) || "N/A")}
                    > **Files uploaded/last 1 min**: ${inlineCode("~" + formatNumber(global.last_total_file != 0 ? responses.server?.server_stats?.total_file - global.last_total_file : 0) || "N/A")}
                    `
                }, {
                    name: `${getEmoji("upload")} **Request Queue:**`,
                    value: `
                    > **Current Requests:** ${inlineCode(responses.server?.server_stats?.queue_active.toString() || "N/A")}
                    > **Requests In Queue:** ${inlineCode(responses.server?.server_stats?.queue_waiting.toString() || "N/A")}
                    `
                },
            ],

            footer: {
                text: "Lua Obfuscator - Service Status • by mopsfl"
            }
        })]
    },

    async updateStatusMessage(update_start_tick = new Date().getTime()) {
        if (!global.status_channel) return console.error("global.status_channel is not defined")
        if (!global.createStatusEmbed) return console.error("global.createStatusEmbed is not defined.")

        const responses = {
            WEBSITE_URL: { ping: "N/A", status: "N/A", statusText: "N/A" },
            FORUM_URL: { ping: "N/A", status: "N/A", statusText: "N/A" },
            API_URL: { ping: "N/A", status: "N/A", statusText: "N/A" },
            server: { ping: "N/A", server_stats: {} }
        }

        const server_stats_tick = new Date().getTime(); const server_stats = await fetchJSON(config.SERVER_STATS_URL); responses.server.ping = Math.round(new Date().getTime() - server_stats_tick)
        const server_uptime = new Date().getTime() - new Date(server_stats?.start_time).getTime() || "N/A"
        responses.server.server_stats = server_stats

        let finished_requests = 0
        Object.values(config.STATUS_ENDPOINTS).forEach(async endpoint => {
            const index = Object.values(config.STATUS_ENDPOINTS).indexOf(endpoint)
            const start_tick = new Date().getTime()
            const value = Object.keys(config.STATUS_ENDPOINTS)[index]

            try {
                await _fetch(endpoint, { timeout: config.FETCH_TIMEOUT, method: value != "API_URL" ? "GET" : "POST" }).then(res => {
                    responses[value].ping = new Date().getTime() - start_tick
                    responses[value].status = res.status
                    responses[value].statusText = res.statusText
                    finished_requests++
                })
            } catch (error) {
                const isAbortError = error.name === "AbortError"
                if (isAbortError) {
                    responses[value].ping = config.FETCH_TIMEOUT
                    responses[value].status = 408
                    responses[value].statusText = "Request timed out"
                    finished_requests++
                }
            }

            if (finished_requests >= Object.keys(config.STATUS_ENDPOINTS).length) {
                let all_online = Object.values(responses).find(_res => _res?.status != 200 && !_res.server_stats) ? false : true
                if (!all_online) {
                    global.last_outtage = new Date().getTime()
                }

                await global.status_channel.messages.fetch(config.STATUS_EMBED_ID).then(async (msg) => {
                    msg.edit({
                        embeds: await global.createStatusEmbed(responses, server_uptime, true, all_online)
                    })
                    global.last_statusupdate = new Date().getTime()
                    console.log(`status display updated (took ${Math.round(new Date().getTime() - update_start_tick)}ms)`)
                }).catch(err => console.error(err))

                global.last_total_obfuscations = server_stats?.total_obfuscations || "N/A"
                global.last_total_file = server_stats?.total_file || "N/A"
                global.last_status = responses
            }
        })
    }
}

//| ${!isNaN(responses.WEBSITE_URL.ping) ? responses.WEBSITE_URL.ping + "ms" : "N/A"})