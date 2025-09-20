import { Colors, EmbedBuilder, Message, TextBasedChannel } from "discord.js";
import { client, config, env, obfuscatorStats } from "../../index"
import Main from "./Embeds/Main";
import Embed from "../Embed";
import Fields from "./Fields";
import Services from "./Services";
import GetEmoji from "../GetEmoji";
import { ServiceOutage, ServiceStatus } from "./Types";
import Database from "../Database/Database";
import FormatUptime from "../FormatUptime";
import FormatBytes from "../FormatBytes";
import Stats from "./Embeds/Stats";
import FormatNumber from "../FormatNumber";
import Alert from "./Embeds/Alert";
import { createHash } from "crypto";
export default class StatusDisplayController {
    constructor(
        public statusChannel?: TextBasedChannel,
        public statusMessage?: Message,
        public alertChannel?: TextBasedChannel,

        public mainEmbed?: EmbedBuilder,
        public statisticsEmbed?: EmbedBuilder,

        public lastUpdate: number = 0,
        public lastOutage: ServiceOutage = null,

        public _initTime: number = 0
    ) { }

    async init() {
        this._initTime = Date.now()
        this.mainEmbed = Embed(Main())
        this.statisticsEmbed = Embed(Stats())

        await client.channels.fetch(config[env].STATUS_CHANNEL_ID).then(async channel => {
            if (!channel.isTextBased()) return console.error(`[Status Display Error]: status channel '${channel.id}' must be textBased.`)
            this.statusChannel = channel
            this.statusMessage = (await this.statusChannel.messages.fetch()).first()
        }).catch(err => {
            console.error(`[Status Display Error]:`, err)
        })

        await client.channels.fetch(config.STATUS_DISPLAY.alert_channel).then(channel => {
            if (!channel.isTextBased()) return console.error(`[Status Display Error]: alert channel '${channel.id}' must be textBased.`)
            this.alertChannel = channel
        }).catch(err => {
            console.error(`[Status Display Error]:`, err)
        })

        this.lastOutage = await this.GetLastOutage();

        (async () => {
            while (true) {
                const start = Date.now();
                try {
                    await this.Update();
                } catch (err) {
                    console.error("[Status Display Update Error]:", err);
                }
                await new Promise(resolve =>
                    setTimeout(resolve, Math.max(config.STATUS_DISPLAY.status_update_interval - (Date.now() - start), 0))
                );
            }
        })();

        console.log(`> status display initialized in ${Date.now() - this._initTime}ms`)
    }

    async Update() {
        if (!this.mainEmbed) this.mainEmbed = Embed(Main())
        if (!this.statisticsEmbed) this.statisticsEmbed = Embed(Stats())

        const mainEmbed = this.mainEmbed,
            statisticsEmbed = this.statisticsEmbed,
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
            const outageId = this.CreateOutageIdentifier(failedServices)

            if (this.lastOutage?.id == outageId && (Date.now() - this.lastOutage.time) < 300_000) {
                if (this.lastOutage.count === 3) {
                    this.SendAlertMessage(failedServices, outageId)
                }

                this.lastOutage.count += 1
            } else {
                this.lastOutage = {
                    time: new Date().getTime(),
                    services: Object.fromEntries(failedServices),
                    id: outageId,
                    count: 0,
                }

                this.SaveOutage(failedServices, outageId).catch(err => console.error("[Status Display Error]:", err))
            }
        } else {
            this.lastOutage = await this.GetLastOutage()
        }

        this.lastUpdate = new Date().getTime()
        mainEmbed.setColor(failedServices.size > 0 ? Colors.Red : Colors.Green)

        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.LastUpdated, this.lastUpdate ? `<t:${(this.lastUpdate / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.LastOutage, this.lastOutage ? `<t:${(this.lastOutage.time / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.serverUptime, serverStatistics ? FormatUptime(new Date().getTime() - new Date(serverStatistics.start_time).getTime(), true) : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.memoryUsage, serverStatistics ? FormatBytes(serverStatistics.memory_usage) : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.botUptime, client ? FormatUptime(client.uptime, true) : "N/A")
        Fields.SetValue(statisticsEmbed.data.fields, Fields.Indexes.Stats.totalObfuscations, serverStatistics ? FormatNumber(serverStatistics.total_obfuscations) : "N/A")
        Fields.SetValue(statisticsEmbed.data.fields, Fields.Indexes.Stats.recentObfuscations, "N/A")

        obfuscatorStats.Update({
            total_file_uploads: serverStatistics.total_file,
            total_obfuscations: serverStatistics.total_obfuscations,
            time: new Date().getTime()
        })

        await this.statusMessage.edit({ embeds: [mainEmbed, statisticsEmbed] })
    }

    GetStatusEmoji(statusCode: number | string) {
        return statusCode == 200 ? GetEmoji("online") : GetEmoji("offline")
    }

    CreateOutageIdentifier(services: Map<string, ServiceStatus>, length = 12) {
        const relevantData = Array.from(services.entries())
            .map(([name, status]) => ({ name, statusCode: status.statusCode }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return createHash('sha256').update(JSON.stringify(relevantData)).digest('hex').slice(0, length);
    }

    async SaveOutage(services: Map<string, ServiceStatus>, outageId: string) {
        const time = new Date().getTime()

        await Database.Insert("outage_log", {
            time: time.toString(),
            services: JSON.stringify(Object.fromEntries(services)),
            id: outageId,
        })
    }

    async GetLastOutage(): Promise<ServiceOutage> {
        const result = await Database.GetTable("outage_log", null, true)

        if (result.success) {
            return {
                time: result.data.time,
                services: JSON.parse(result.data.services) || {},
                id: result.data.id,
                count: 0
            }
        } else {
            console.error("[Status Display Database Error]:", result.error.message)
        }
    }

    async SendAlertMessage(failedServices: Map<string, ServiceStatus>, outageId: string) {
        if (this.alertChannel) {
            let alertEmbed = Embed(Alert()),
                affected_services = []

            failedServices.forEach((serviceStatus, serviceName) => {
                affected_services.push(`${GetEmoji("offline")} **${serviceName}: \`${serviceStatus.statusText} (${serviceStatus.statusCode}) | ${serviceStatus.ping}ms\`**`)
            })

            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.affectedServices, affected_services.join("\n-# "))
            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.outageTime, new Date().toUTCString())
            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.outageId, outageId)

            this.alertChannel.send({ embeds: [alertEmbed], content: config.STATUS_DISPLAY.ids_to_alert.map(id => `<@${id}>`).join(' ') })
        }
    }
}