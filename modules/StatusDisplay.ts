import * as self from "../index"
import { Channel, Message, MessageType, TextChannel, Embed, inlineCode, Colors } from "discord.js";
import Config from "../config"
import GetEmoji from "./GetEmoji"
import FormatUptime from "./FormatUptime";
import FormatBytes from "./FormatBytes";
import CountMembers from "./CountMembers";

export default class StatusDisplay {
    constructor(
        public status_channel?: TextChannel,
        public status_message?: Message,
        public initialized: boolean = false,
    ) { }

    async init() {
        await self.client.channels.fetch(self.config.STATUS_DISPLAY.STATUS_CHANNEL_ID).then(async channel => {
            //@ts-ignore - dont know how to fix this type error
            this.status_channel = channel
            await this.status_channel.messages.fetch().then(messages => {
                this.status_message = messages.first()
                this.initialized = true
            })
        }).catch(async err => await self.Debug(err))
    }

    async CreateStatusEmbed(ping_responses: PingResponses, server_uptime: number, show_next_update: boolean = false, outtage?: boolean) {
        if (!this.initialized && !self.client) return self.Debug({ message: "Unable to create status embed.", error: "App not successfully initialized." }, true)
        return [self.Embed({
            title: "Lua Obfuscator - Service Status",
            description: `All statuses of Lua Obfuscator services displayed.${show_next_update == true ? `
            \n${GetEmoji("update")} **Last Updated:** <t:${(new Date().getTime() / 1000).toFixed()}:R>` : ""}
            ${GetEmoji("offline")} **Last Outage:** ${global.last_outtage ? `<t:${Math.round(global.last_outtage / 1000)}:R>` : `${inlineCode("N/A")}`}`,
            color: outtage ? Colors.Green : Colors.Red,
            thumbnail: self.config.icon_url,
            timestamp: true,
            fields: [
                {
                    name: `${GetEmoji("website")} **Website:**`,
                    value: `
                    > **Homepage**: ${ping_responses.website?.status == 200 ? "Online" : "Offline"} ${ping_responses.website?.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${ping_responses.website?.statusText} - ${ping_responses.website?.status} | ${!isNaN(ping_responses.website?.ping) ? ping_responses.website?.ping + "ms" : "N/A"})`)}
                    > **Forum**: ${ping_responses.forum?.status == 200 ? "Online" : "Offline"} ${ping_responses.forum?.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${ping_responses.forum?.statusText} - ${ping_responses.forum?.status} | ${!isNaN(ping_responses.website?.ping) ? ping_responses.forum?.ping + "ms" : "N/A"})`)}
                    > **API**: ${ping_responses.api?.status == 200 ? "Online" : "Offline"} ${ping_responses.api?.status == 200 ? GetEmoji("online") : GetEmoji("offline")} ${inlineCode(`(${ping_responses.api?.statusText} - ${ping_responses.api?.status} | ${!isNaN(ping_responses.website?.ping) ? ping_responses.api?.ping + "ms" : "N/A"})`)}
                ` },
                {
                    name: `${GetEmoji("discord")} **Discord:**`,
                    value: `
                    > **Bot Status**: ${self.client.uptime > 0 ? "Online" : "Offline"} ${self.client.uptime > 0 ? GetEmoji("online") : GetEmoji("offline")}
                    > **Bot Uptime**: ${inlineCode(FormatUptime(self.client.uptime) || "N/A")}
                    > **Members**: ${inlineCode(CountMembers())}
                    `
                },
                {
                    name: `${GetEmoji("server_luaobf")} **Lua Obfuscator - Server:**`,
                    value: `
                    > **Ping**: ${inlineCode(ping_responses.server?.ping?.toString() || "N/A")}
                    > **Uptime**: ${inlineCode(FormatUptime(server_uptime) || "N/A")}
                    > **Memory Usage**: ${inlineCode(FormatBytes(ping_responses.server?.server_stats.memory_usage) || "N/A")}
                    `
                },
                {
                    name: `${GetEmoji("server_discord")} **Bot Hosting - Server:**`,
                    value: `
                    > **Uptime**: ${inlineCode(FormatUptime(new Date().getTime() - global.server_start_tick) || "N/A")}
                    > **Memory Usage**: ${inlineCode(FormatBytes(process.memoryUsage().heapUsed) || "N/A")}
                    `
                }
            ],
            footer: {
                text: "Lua Obfuscator - Service Status • by mopsfl"
            }
        }),]
    }
}

export interface PingResponses {
    website: PingResponse,
    forum: PingResponse,
    api: PingResponse,
    server: ServerStatsResponse
}

export interface PingResponse {
    ping: number,
    status: number | string,
    statusText: string
}

export interface ServerStatsResponse {
    ping: number,
    server_stats: {
        start_time: string
        memory_usage: number
        queue_waiting: number
        queue_active: number
        queue_total: number
        total_file: number
        total_obfuscations: number
    }
}