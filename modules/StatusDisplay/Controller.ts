import { client, config, utils, obfuscatorStats, env, Bot_Settings, file_cache, start_tick } from "../../index"
import { Message, inlineCode, Colors, Channel, hyperlink } from "discord.js";
import GetEmoji from "../GetEmoji"
import FormatUptime from "../FormatUptime";
import FormatBytes from "../FormatBytes";
import CountMembers from "../CountMembers";
import getStatusCode from "url-status-code"
import http_status from "http-status"
import FormatNumber from "../FormatNumber";
import { gunzipSync, gzipSync } from "zlib";
import ChartImage from "../ChartImage";
import Embed from "../Embed";
import { PingResponses, Outage, PingResponse } from "./Types";

const _http_status = { ...http_status, ...http_status.extra.cloudflare, ...http_status.extra.nginx }

export default class StatusDisplayController {
    constructor(
        public status_channel?: Channel,
        public status_message?: Message,
        public initialized: boolean = false,
        public last_statusupdate: number = new Date().getTime(),

        public lastXMin_Count: number = 0, //idk how to call this lol
        public last_total_obfuscations: number = 0,
        public last_total_file: number = 0,
        public last_responses: string | PingResponses = "N/A",

        public default_outage: Outage = { time: "N/A", status: "N/A", affected_services: [], state: false },
        public last_outage: Outage = default_outage,
        public last_outage_cache: Outage = default_outage,
        public current_outage_length: number = 0,
        public current_outage_time: number = 0,
        public current_outage_state: boolean = false,
    ) { }

    async init() {
        await client.channels.fetch(config[env].STATUS_CHANNEL_ID).then(async channel => {
            this.status_channel = channel
            if (!this.status_channel.isTextBased()) return console.error(`channel ${this.status_channel} must be textBased.`)
            await this.status_channel.messages.fetch().then(messages => {
                this.status_message = messages.first()
                this.initialized = true
            })
        }).catch(async err => console.error(err))
    }

    async CreateStatusEmbed(ping_responses: PingResponses, server_uptime: number, show_next_update: boolean = false) {
        if (!this.initialized && !client) {
            return console.error({ message: "Unable to create status embed.", error: "App not successfully initialized." }, true);
        }

        const stats_chart = ChartImage.Create({
            type: "bar",
            data: {
                labels: ChartImage.GetLocalizedDateStrings(),
                datasets: [
                    {
                        label: "Daily Obfuscated Files",
                        data: await obfuscatorStats.ParseCurrentStat("total_obfuscations"),
                        fill: false,
                        backgroundColor: "#36a2eb",
                    },
                ],
            },
            options: { scales: { xAxes: [{ barPercentage: 0.5 }] } }
        }).backgroundColor("white").toURL();
        return [
            Embed({
                title: "Lua Obfuscator - Service Status",
                color: this.last_outage.state ? Colors.Red : Colors.Green,
                thumbnail: config.icon_url,
                timestamp: true,
                fields: [
                    {
                        name: `${GetEmoji("update")} Last Updated`,
                        value: `-# <t:${(new Date().getTime() / 1000).toFixed()}:R>`,
                        inline: true
                    },
                    { name: "\u200B", value: "\u200B", inline: true },
                    {
                        name: `${GetEmoji("offline")} Last Outage`,
                        value: `-# ${this.last_outage.state ? `<t:${Math.round(parseInt(this.last_outage.time.toString()) / 1000)}:R>` : this.last_outage_cache.state ? `<t:${Math.round(parseInt(this.last_outage_cache.time.toString()) / 1000)}:R>` : inlineCode("N/A")}`,
                        inline: true
                    },
                    { name: "\u200B", value: "**__Services:__**", inline: false },
                    {
                        name: "Homepage:",
                        value: `-# ${this.GetStatusEmoji(ping_responses.homepage.status)} ${ping_responses.homepage.statusText} -  ${ping_responses.homepage.ping}ms`,
                        inline: true,
                    },
                    {
                        name: "Forum:",
                        value: `-# ${this.GetStatusEmoji(ping_responses.forum.status)} ${ping_responses.forum.statusText} - ${ping_responses.forum.ping}ms`,
                        inline: true,
                    },
                    {
                        name: "API:",
                        value: `-# ${this.GetStatusEmoji(ping_responses.api.status)} ${ping_responses.api.statusText} - ${ping_responses.api.ping}ms`,
                        inline: true,
                    },
                    { name: "\u200B", value: "**__Other Statistics:__**", inline: false },
                    {
                        name: "Server Uptime:",
                        value: `-# ${FormatUptime(server_uptime, true) || "N/A"}`,
                        inline: true,
                    },
                    {
                        name: "Memory Usage:",
                        value: `-# ${FormatBytes(ping_responses.server?.server_stats.memory_usage) || "N/A"}`,
                        inline: true,
                    },
                    {
                        name: "Ping:",
                        value: `-# ${ping_responses.server?.ping?.toString() + "ms"}`,
                        inline: true,
                    },
                    {
                        name: "Discord Members:",
                        value: `-# ${CountMembers().toString()}`,
                        inline: true,
                    },
                    {
                        name: "Bot Uptime:",
                        value: `-# ${FormatUptime(client.uptime, true) || "N/A"}`,
                        inline: true,
                    },
                    { name: "\u200B", value: "\u200B", inline: true },
                ],
                footer: {
                    text: "Lua Obfuscator - Service Status • by mopsfl",
                    iconURL: config.icon_url
                },
            }),
            Embed({
                title: "Lua Obfuscator - Statistics",
                color: Colors.Green,
                thumbnail: config.icon_url,
                timestamp: true,
                image: stats_chart,
                fields: [
                    { name: "Total Files Uploaded", value: `-# ${FormatNumber(ping_responses.server?.server_stats?.total_file) || "N/A"}`, inline: true },
                    { name: "Total Obfuscations", value: `-# ${FormatNumber(ping_responses.server?.server_stats?.total_obfuscations) || "N/A"}`, inline: true },
                    { name: "Recent Obfuscations", value: `-# ${"~ " + FormatNumber(this.last_total_obfuscations != 0 ? ping_responses.server?.server_stats?.total_obfuscations - this.last_total_obfuscations : 0) || "N/A"}`, inline: false }
                ],
                footer: {
                    text: "Lua Obfuscator - Service Status • by mopsfl",
                },
            }),
        ];
    }


    async UpdateDisplayStatus() {
        const update_start_tick = new Date().getTime()
        const responses: PingResponses = {
            homepage: { name: "homepage", ping: "N/A", status: "N/A", statusText: "N/A" },
            forum: { name: "forum", ping: "N/A", status: "N/A", statusText: "N/A" },
            api: { name: "api", ping: "N/A", status: "N/A", statusText: "N/A" },
            server: { name: "stats", ping: "N/A", status: "N/A", server_stats: {} }
        }
        let finished_requests = 0

        Object.values(config.STATUS_DISPLAY.endpoints).forEach(async endpoint => {
            const index = Object.values(config.STATUS_DISPLAY.endpoints).indexOf(endpoint)
            const value = Object.keys(config.STATUS_DISPLAY.endpoints)[index]

            try {
                const start_tick = new Date().getTime()
                const code = await getStatusCode(endpoint)
                if (value == "server") { responses[value].server_stats = await fetch(endpoint).then(res => res.ok && res.json()) }
                responses[value].ping = new Date().getTime() - start_tick
                responses[value].status = (code == 405 && value == "api" ? 200 : code)
                responses[value].statusText = (code == 405 && value == "api" ? _http_status[200] : _http_status[code])
                finished_requests++
            } catch (error) {
                const isAbortError = error.name === "AbortError"
                if (isAbortError) {
                    const status = _http_status.REQUEST_TIMEOUT
                    responses[value].ping = config.STATUS_DISPLAY.fetch_timeout
                    responses[value].status = status
                    responses[value].statusText = _http_status[status]
                    finished_requests++
                } else {
                    console.error(error);
                }
            }
            if (finished_requests >= Object.keys(config.STATUS_DISPLAY.endpoints).length) {
                const all_online = Object.values(responses).find(_res => _res.status != 200 && !_res.server_stats) ? false : true
                const server_uptime = new Date().getTime() - new Date(responses.server?.server_stats?.start_time).getTime()
                if (!all_online) {
                    const affected_services = Object.values(responses).filter(v => v.status !== 200)

                    // Outage Alert
                    if (this.current_outage_time < 1) this.current_outage_time = new Date().getTime()
                    this.current_outage_length++;
                    if (config.STATUS_DISPLAY.alerts && this.current_outage_length >= 5 && this.current_outage_state == false) {
                        this.current_outage_state = true
                        config.STATUS_DISPLAY.ids_to_alert.forEach(async uid => {
                            let alert_channel = client.channels.cache.get(config.STATUS_DISPLAY.alert_channel),
                                affected_services_text = ""

                            affected_services.forEach(service => {
                                affected_services_text = affected_services_text + `${inlineCode(service.name)}: ${service.status === 200 ? "Online" : "Offline"} ${service.status === 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${service.statusText} - ${service.status} | ${service.ping ? service.ping + "ms" : "N/A"})`)}\n`
                            })
                            const bot_settings: Bot_Settings = await file_cache.get("bot_settings")
                            if (alert_channel?.isTextBased() && env === "prod") {
                                alert_channel.send({
                                    content: bot_settings.alert_pings === true ? `<@${uid}>` : undefined,
                                    embeds: [
                                        Embed({
                                            title: `${GetEmoji("no")} Service Outage - Alert`,
                                            description: "A service outage has been detected.",
                                            color: Colors.Red,
                                            fields: [
                                                { name: "Affected Services:", value: affected_services_text, inline: false },
                                                { name: "Outage Info:", value: `Outage since: <t:${Math.round(parseInt(this.current_outage_time.toString()) / 1000)}:R>`, inline: false }
                                            ],
                                            timestamp: true,
                                        })
                                    ]
                                })
                            }
                        })
                    }

                    this.last_outage = {
                        state: true,
                        time: new Date().getTime(),
                        affected_services: affected_services
                    }
                    try {
                        //@ts-ignore
                        const outage_log: OutageLog = JSON.parse(gunzipSync(Buffer.from(await file_cache.getSync("outage_log"), "base64")))
                        outage_log.outages.push(this.last_outage)

                        file_cache.setSync("last_outage", this.last_outage) //@ts-ignore
                        file_cache.setSync("outage_log", utils.ToBase64(gzipSync(JSON.stringify(outage_log))))
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    const last_outage: Outage = await file_cache.getSync("last_outage")
                    this.last_outage.state = false
                    this.current_outage_state = false
                    this.current_outage_length = 0
                    this.current_outage_time = 0
                    if (last_outage && last_outage.time) {
                        this.last_outage_cache = last_outage
                    }
                }

                await this.status_message.edit({
                    // @ts-ignore - dont know how to fix this type error
                    embeds: await this.CreateStatusEmbed(responses, server_uptime, true, all_online)
                })

                if (this.lastXMin_Count < 5) {
                    this.lastXMin_Count++;
                } else if (this.lastXMin_Count >= 5) {
                    this.last_total_obfuscations = responses.server.server_stats?.total_obfuscations;
                    this.last_total_file = responses.server.server_stats?.total_file;
                    this.lastXMin_Count = 0;
                }
                this.last_responses = responses
                this.last_statusupdate = new Date().getTime()

                obfuscatorStats.Update({
                    total_file_uploads: responses.server.server_stats.total_file,
                    total_obfuscations: responses.server.server_stats.total_obfuscations,
                    time: new Date().getTime()
                })

                console.log(`> status display updated. (took ${new Date().getTime() - update_start_tick}ms)`)
            }
        })
    }

    CreateServiceStatusField = (name: string, response: PingResponse) => {
        return `> **${name}**: ${response.status == 200 ? "Online" : "Offline"} ${response.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${response.statusText} - ${response.status} | ${response.ping ? response.ping + "ms" : "N/A"})`)}`;
    }

    GetStatusEmoji(statusCode: number | string) {
        return statusCode == 200 ? GetEmoji("online") : GetEmoji("offline")
    }
}