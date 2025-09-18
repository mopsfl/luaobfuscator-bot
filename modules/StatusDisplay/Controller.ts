import { Channel, Colors, Message, TextBasedChannel } from "discord.js";
import { client, config, env } from "../../index"
import Main from "./Embeds/Main";
import Embed from "../Embed";
import Fields from "./Fields";
import Services from "./Services";
import GetEmoji from "../GetEmoji";
import { ServiceStatus } from "./Types";
import Database from "../Database";
import FormatUptime from "../FormatUptime";
import FormatBytes from "../FormatBytes";
import Stats from "./Embeds/Stats";
import FormatNumber from "../FormatNumber";

export default class StatusDisplayController {
    constructor(
        public statusChannel?: TextBasedChannel,
        public statusMessage?: Message,

        public lastUpdate: number = 0,
        public lastOutage: { time: number, services: { [name: string]: ServiceStatus } } = null,
    ) { }

    async init() {
        await client.channels.fetch(config[env].STATUS_CHANNEL_ID).then(async channel => {
            if (!channel.isTextBased())
                return console.error(`[Status Display Error]: channel '${channel.id}' must be textBased.`)
            this.statusChannel = channel
            this.statusMessage = (await this.statusChannel.messages.fetch()).first()
        }).catch(err => {
            console.error(`[Status Display Error]:`, err)
        })

        const [lastOutage, errorCode, errorMessage] = await Database.GetTable("outage_log", null, true)
        if (lastOutage) {
            this.lastOutage = {
                time: lastOutage.time,
                services: JSON.parse(lastOutage.data) || {}
            }
        } else {
            console.error("[Status Display Database Error]:", errorCode, errorMessage)
        }

        const RunUpdateLoop = async () => {
            try { await this.Update() }
            catch (err) { console.error("[Status Display Update Error]:", err) }
            finally { setTimeout(RunUpdateLoop, 60_000) }
        }; RunUpdateLoop()
        console.log("> status display initialized")
    }

    async Update() {
        const mainEmbed = Embed(Main()),
            statisticsEmbed = Embed(Stats()),
            start_tick = new Date().getTime(),
            [serviceStatuses, failedServices] = await Services.GetStatuses(),
            serverStatistics = await Services.GetStatistics()

        serviceStatuses.forEach((serviceStatus, serviceName) => {
            if (!Fields.Indexes.Main.Services[serviceName]) return

            Fields.SetValue(
                mainEmbed.data.fields,
                Fields.Indexes.Main.Services[serviceName],
                `${this.GetStatusEmoji(serviceStatus.statusCode)} ${serviceStatus.statusText} - ${serviceStatus.ping}ms`
            )
        })

        if (failedServices.size > 0) {
            this.lastOutage = {
                time: new Date().getTime(),
                services: Object.fromEntries(failedServices)
            }

            this.SaveOutage(failedServices).catch(err => console.error("[Status Display Error]:", err))
        }

        this.lastUpdate = new Date().getTime()
        mainEmbed.setColor(failedServices.size > 0 ? Colors.Red : Colors.Green)

        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.LastUpdated, this.lastUpdate ? `<t:${(this.lastUpdate / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.LastOutage, this.lastOutage ? `<t:${(this.lastOutage.time / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.serverUptime, serverStatistics ? FormatUptime(new Date().getTime() - new Date(serverStatistics.start_time).getTime(), true) : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.memoryUsage, serverStatistics ? FormatBytes(serverStatistics.memory_usage) : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.botUptime, client ? FormatUptime(client.uptime, true) : "N/A")
        Fields.SetValue(statisticsEmbed.data.fields, Fields.Indexes.Stats.totalObfuscations, serverStatistics ? FormatNumber(serverStatistics.total_obfuscations) : "N/A")
        Fields.SetValue(statisticsEmbed.data.fields, Fields.Indexes.Stats.recentObfuscations, "0")

        await this.statusMessage.edit({ embeds: [mainEmbed, statisticsEmbed] })
        console.log(`> updated status display (took ${this.lastUpdate - start_tick}ms)`)
    }

    GetStatusEmoji(statusCode: number | string) {
        return statusCode == 200 ? GetEmoji("online") : GetEmoji("offline")
    }

    async SaveOutage(services: Map<string, ServiceStatus>) {
        const time = new Date().getTime()

        await Database.Insert("outage_log", {
            time: time.toString(),
            data: JSON.stringify(Object.fromEntries(services))
        })
    }
}