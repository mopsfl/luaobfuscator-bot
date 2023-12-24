import * as self from "../index"
import { Message, TextChannel, inlineCode, Colors } from "discord.js";
import GetEmoji from "./GetEmoji"
import FormatUptime from "./FormatUptime";
import FormatBytes from "./FormatBytes";
import CountMembers from "./CountMembers";
import getStatusCode from "url-status-code"
import http_status from "http-status"
import FormatNumber from "./FormatNumber";

export default class StatusDisplay {
    constructor(
        public status_channel?: TextChannel,
        public status_message?: Message,
        public initialized: boolean = false,
        public last_statusupdate: number = new Date().getTime(),

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
        await self.client.channels.fetch(self.config[self.env].STATUS_CHANNEL_ID).then(async channel => {
            //@ts-ignore - dont know how to fix this type error
            this.status_channel = channel
            await this.status_channel.messages.fetch().then(messages => {
                this.status_message = messages.first()
                this.initialized = true
            })
        }).catch(async err => await self.Debug(err))
    }

    async CreateStatusEmbed(ping_responses: PingResponses, server_uptime: number, show_next_update: boolean = false) {
        if (!this.initialized && !self.client) return self.Debug({ message: "Unable to create status embed.", error: "App not successfully initialized." }, true)
        const stats_chart = self.chartImage.Create({
            type: "bar",
            data: {
                labels: self.chartImage.GetLocalizedDateStrings(),
                datasets: [{
                    label: "Total Files Uploaded",
                    data: await self.obfuscatorStats.ParseCurrentStat("total_file_uploads"),
                    fill: true,
                    backgroundColor: "rgba(54, 235, 169, 0.8)"
                }, {
                    label: "Total Files Obfuscated",
                    data: await self.obfuscatorStats.ParseCurrentStat("total_obfuscations"),
                    fill: true,
                    backgroundColor: "rgba(54, 162, 235, 0.8)"
                }]
            }
        }).backgroundColor("white").toURL();
        return [self.Embed({
            title: "Lua Obfuscator - Service Status",
            description: `The status of Lua Obfuscator services displayed.${show_next_update == true ? `
            \n${GetEmoji("update")} **Last Updated:** <t:${(new Date().getTime() / 1000).toFixed()}:R>` : ""}
            ${GetEmoji("offline")} **Last Outage:** ${this.last_outage.state ? `<t:${Math.round(parseInt(this.last_outage.time.toString()) / 1000)}:R>` : this.last_outage_cache.state ? `<t:${Math.round(parseInt(this.last_outage_cache.time.toString()) / 1000)}:R>` : `${inlineCode("N/A")}`}`,
            color: this.last_outage.state ? Colors.Red : Colors.Green,
            thumbnail: self.config.icon_url,
            timestamp: true,
            fields: [
                {
                    name: `${GetEmoji("website")} **Website:**`,
                    inline: false,
                    value: `
                    > **Homepage**: ${ping_responses.homepage?.status == 200 ? "Online" : "Offline"} ${ping_responses.homepage?.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${ping_responses.homepage?.statusText} - ${ping_responses.homepage?.status} | ${ping_responses.homepage?.ping ? ping_responses.homepage?.ping + "ms" : "N/A"})`)}
                    > **Forum**: ${ping_responses.forum?.status == 200 ? "Online" : "Offline"} ${ping_responses.forum?.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${ping_responses.forum?.statusText} - ${ping_responses.forum?.status} | ${ping_responses.forum?.ping ? ping_responses.forum?.ping + "ms" : "N/A"})`)}
                    > **API**: ${ping_responses.api?.status == 200 ? "Online" : "Offline"} ${ping_responses.api?.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${ping_responses.api?.statusText} - ${ping_responses.api?.status} | ${ping_responses.api?.ping ? ping_responses.api?.ping + "ms" : "N/A"})`)}
                ` },
                {
                    name: `${GetEmoji("discord")} **Discord:**`,
                    inline: false,
                    value: `
                    > **Bot Status**: ${self.client.uptime > 0 ? "Online" : "Offline"} ${self.client.uptime > 0 ? GetEmoji("online") : GetEmoji("offline")}
                    > **Bot Uptime**: ${inlineCode(FormatUptime(self.client.uptime) || "N/A")}
                    > **Members**: ${inlineCode(CountMembers().toString())}
                    `
                },
                {
                    name: `${GetEmoji("server_luaobf")} **Lua Obfuscator - Server:**`,
                    inline: false,
                    value: `
                    > **Ping**: ${inlineCode(ping_responses.server?.ping?.toString() || "N/A")}
                    > **Uptime**: ${inlineCode(FormatUptime(server_uptime) || "N/A")}
                    > **Memory Usage**: ${inlineCode(FormatBytes(ping_responses.server?.server_stats.memory_usage) || "N/A")}
                    `
                },
                {
                    name: `${GetEmoji("server_discord")} **Bot Hosting - Server:**`,
                    inline: false,
                    value: `
                    > **Uptime**: ${inlineCode(FormatUptime(new Date().getTime() - self.start_tick) || "N/A")}
                    > **Memory Usage**: ${inlineCode(FormatBytes(process.memoryUsage().heapUsed) || "N/A")}
                    `
                }
            ],
            footer: {
                text: "Lua Obfuscator - Service Status • by mopsfl"
            }
        }), self.Embed({
            title: "Lua Obfuscator - Statistics",
            description: `Live statistics of Lua Obfuscator.${show_next_update == true ? `
            \n${GetEmoji("update")} **Last Updated:** <t:${(new Date().getTime() / 1000).toFixed()}:R>` : ""}`,
            color: Colors.Green,
            thumbnail: self.config.icon_url,
            timestamp: true,
            image: stats_chart,
            fields: [
                {
                    name: `${GetEmoji("luaobfuscator")} **Obfusactor Statistics:**`,
                    inline: false,
                    value: `
                    > **Total Files Uploaded**: ${inlineCode(FormatNumber(ping_responses.server?.server_stats?.total_file) || "N/A")}
                    > **Total Obfuscations**: ${inlineCode(FormatNumber(ping_responses.server?.server_stats?.total_obfuscations) || "N/A")}
                    > **Obfuscations/last 1 min**: ${inlineCode("~" + FormatNumber(this.last_total_obfuscations != 0 ? ping_responses.server?.server_stats?.total_obfuscations - this.last_total_obfuscations : 0) || "N/A")}
                    > **Files uploaded/last 1 min**: ${inlineCode("~" + FormatNumber(this.last_total_file != 0 ? ping_responses.server?.server_stats?.total_file - this.last_total_file : 0) || "N/A")}
                    `
                }, {
                    name: `${GetEmoji("upload")} **Request Queue:**`,
                    inline: false,
                    value: `
                    > **Current Requests:** ${inlineCode(ping_responses.server?.server_stats?.queue_active?.toString() || "N/A")}
                    > **Requests In Queue:** ${inlineCode(ping_responses.server?.server_stats?.queue_waiting?.toString() || "N/A")}
                    `
                },
            ],
            footer: {
                text: "Lua Obfuscator - Service Status • by mopsfl"
            }
        })]
    }

    async UpdateDisplayStatus() {
        const responses: PingResponses = {
            homepage: { name: "homepage", ping: "N/A", status: "N/A", statusText: "N/A" },
            forum: { name: "forum", ping: "N/A", status: "N/A", statusText: "N/A" },
            api: { name: "api", ping: "N/A", status: "N/A", statusText: "N/A" },
            server: { name: "stats", ping: "N/A", status: "N/A", server_stats: {} }
        }
        let finished_requests = 0

        Object.values(self.config.STATUS_DISPLAY.endpoints).forEach(async endpoint => {
            const update_start_tick = new Date().getTime()
            const index = Object.values(self.config.STATUS_DISPLAY.endpoints).indexOf(endpoint)
            const value = Object.keys(self.config.STATUS_DISPLAY.endpoints)[index]

            try {
                const start_tick = new Date().getTime()
                const code = await getStatusCode(endpoint)
                if (value == "server") { responses[value].server_stats = await fetch(endpoint, { cache: "no-cache" }).then(res => res.ok && res.json()) }
                responses[value].ping = new Date().getTime() - start_tick
                responses[value].status = (code == 405 && value == "api" ? 200 : code)
                responses[value].statusText = (code == 405 && value == "api" ? http_status[200] : http_status[code])
                finished_requests++
            } catch (error) {
                const isAbortError = error.name === "AbortError"
                if (isAbortError) {
                    const status = http_status.REQUEST_TIMEOUT
                    responses[value].ping = self.config.STATUS_DISPLAY.fetch_timeout
                    responses[value].status = status
                    responses[value].statusText = http_status[status]
                    finished_requests++
                } else console.error(error);
            }
            if (finished_requests >= Object.keys(self.config.STATUS_DISPLAY.endpoints).length) {
                const all_online = Object.values(responses).find(_res => _res.status != 200 && !_res.server_stats) ? false : true
                const server_uptime = new Date().getTime() - new Date(responses.server?.server_stats?.start_time).getTime()
                console.log(FormatUptime(server_uptime));
                if (!all_online) {
                    const affected_services = Object.values(responses).filter(v => v.status != 200)

                    // Outage Alert
                    if (this.current_outage_time < 1) this.current_outage_time = new Date().getTime()
                    this.current_outage_length++;
                    if (self.config.STATUS_DISPLAY.alerts && this.current_outage_length >= 5 && this.current_outage_state == false) {
                        this.current_outage_state = true
                        self.config.STATUS_DISPLAY.ids_to_alert.forEach(uid => {
                            let channel = self.client.channels.cache.get(self.config.STATUS_DISPLAY.alert_channel),
                                affected_services_text = ""

                            affected_services.forEach(service => {
                                affected_services_text = affected_services_text + `${inlineCode(service.name)}: ${service.status == 200 ? "Online" : "Offline"} ${service.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${service.statusText} - ${service.status} | ${service.ping ? service.ping + "ms" : "N/A"})`)}\n`
                            })
                            if (channel.isTextBased()) channel.send({
                                content: `<@${uid}>`,
                                embeds: [
                                    self.Embed({
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
                        })
                    }

                    this.last_outage = {
                        state: true,
                        time: new Date().getTime(),
                        affected_services: affected_services
                    }
                    const outage_log: OutageLog = await self.file_cache.getSync("outage_log")
                    outage_log.outages.push(this.last_outage)

                    self.file_cache.setSync("last_outage", this.last_outage)
                    self.file_cache.setSync("outage_log", outage_log)
                } else {
                    const last_outage: Outage = await self.file_cache.getSync("last_outage")
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

                this.last_total_obfuscations = responses.server.server_stats?.total_obfuscations
                this.last_total_file = responses.server.server_stats?.total_file
                this.last_responses = responses
                this.last_statusupdate = new Date().getTime()

                self.obfuscatorStats.Update({
                    total_file_uploads: responses.server.server_stats.total_file,
                    total_obfuscations: responses.server.server_stats.total_obfuscations,
                    time: new Date().getTime()
                })

                console.log(`> status display updated. (took ${new Date().getTime() - update_start_tick}ms)`)
            }
        })
    }
}

export interface PingResponses {
    homepage?: PingResponse,
    forum?: PingResponse,
    api?: PingResponse,
    server?: ServerStatsResponse
}

export interface PingResponse {
    name?: string,
    ping?: number | string,
    status?: number | string,
    statusText?: string,
    server_stats?: ServerStats
}

export interface ServerStatsResponse {
    name?: string,
    ping: number | string,
    status?: number | string,
    statusText?: string,
    server_stats: ServerStats
}

export interface ServerStats {
    start_time?: string
    memory_usage?: number
    queue_waiting?: number
    queue_active?: number
    queue_total?: number
    total_file?: number
    total_obfuscations?: number
}

export interface Outage {
    state?: boolean,
    time?: string | number,
    status?: string,
    affected_services: Array<any>
}

export interface OutageLog {
    outages: Outage[]
}