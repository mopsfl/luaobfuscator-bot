import {
    ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle,
    CacheType, ChannelType, Colors, ComponentType, EmbedBuilder,
    InteractionCollector, Message, MessageFlags, TextChannel
} from "discord.js";
import { client, ENV } from "../../index"
import config from "../../config";
import Main from "./Embeds/Main";
import Embed from "../Misc/Embed";
import Fields from "./Fields";
import Services from "./Services";
import { ServiceOutage, ServiceStatus } from "./Types";
import Database from "../Database/Database";
import Stats from "./Embeds/Stats";
import Alert from "./Embeds/Alert";
import { createHash, randomUUID } from "crypto";
import Chart from "./Chart";
import ObfuscatorStats from "../ObfuscatorStats";
import History from "./Embeds/History";
import Session from "../Misc/Session";
import Utils from "../Utils";

export default class StatusDisplayController {
    constructor(
        public statusChannel?: TextChannel,
        public statusMessage?: Message,
        public alertChannel?: TextChannel,

        public mainEmbed?: EmbedBuilder,
        public statisticsEmbed?: EmbedBuilder,

        public outageHistoryButton?: ButtonBuilder,
        public interactionCollector?: InteractionCollector<ButtonInteraction<CacheType>>,

        public lastUpdate = 0,
        public lastOutage: ServiceOutage = null,

        public recentObfuscations: { time: number, difference: number, old: number } = { time: null, difference: 0, old: null },
        public statusResults = new Map<string, ServiceStatus>(),

        public _initTime = 0,
        public _cache: {} = null
    ) { }

    async init() {
        if (!config[ENV]) return console.warn("unable to initialize status display! (missing enviroment type)")
        this._initTime = Date.now()
        this._cache = {}
        this.mainEmbed = Embed(Main())
        this.statisticsEmbed = Embed(Stats())

        await client.channels.fetch(config[ENV]?.STATUS_CHANNEL_ID).then(async channel => {
            if (channel.type !== ChannelType.GuildText) return console.error(`[Status Display Error]: status channel '${channel.id}' must be textBased.`)
            this.statusChannel = channel
            this.statusMessage = (await this.statusChannel.messages.fetch()).first()
        }).catch(err => {
            console.error(`[Status Display Error]:`, err)
        })

        await client.channels.fetch(config[ENV]?.ALERT_CHANNEL).then(channel => {
            if (channel.type !== ChannelType.GuildText) return console.error(`[Status Display Error]: alert channel '${channel.id}' must be textBased.`)
            this.alertChannel = channel
        }).catch(err => {
            console.error(`[Status Display Error]:`, err)
        })

        this.outageHistoryButton = new ButtonBuilder().setLabel("Outage History").setCustomId("outage_history").setStyle(ButtonStyle.Secondary).setEmoji(`<:history:1419671276875939981>`)
        this.interactionCollector = this.statusMessage.createMessageComponentCollector({ componentType: ComponentType.Button })
        this.lastOutage = await this.GetOutage();

        this.interactionCollector.on("collect", this.CreateOutageHistory.bind(this));

        (async () => {
            while (true) {
                const start = Date.now()
                try {
                    await this.Update()
                } catch (err) {
                    console.error("[Status Display Update Error]:", err)
                }
                await new Promise(resolve =>
                    setTimeout(resolve, Math.max(config.STATUS_DISPLAY.status_update_interval - (Date.now() - start), 0))
                )
            }
        })();

        console.log(`> status display initialized in ${Date.now() - this._initTime}ms`)
    }

    async Update() {
        if (!this.mainEmbed) this.mainEmbed = Embed(Main())
        if (!this.statisticsEmbed) this.statisticsEmbed = Embed(Stats())

        const [serviceStatuses, failedServices] = await Services.GetStatuses(),
            serverStatistics = await Services.GetStatistics()

        this.lastUpdate = Date.now()
        this.statusResults = serviceStatuses
        serviceStatuses.forEach((serviceStatus, serviceName) => {
            if (!Fields.Indexes.Main.Services[serviceName]) return

            Fields.SetValue(
                this.mainEmbed.data.fields,
                Fields.Indexes.Main.Services[serviceName],
                `${this.GetStatusEmoji(serviceStatus.statusCode)} ${serviceStatus.statusText} - ${serviceStatus.ping}ms`
            )
        })

        if (failedServices.size > 0) {
            const outageIdentifier = this.CreateOutageIdentifier(failedServices)

            if (!this.lastOutage) this.lastOutage = await this.GetOutage()
            if (this.lastOutage?.identifier === outageIdentifier && !this.lastOutage.end) {
                if ([...failedServices.keys()].length > Object.values(this.lastOutage.services).filter(o => !o.ok).length) {
                    this.SaveOutage(serviceStatuses, outageIdentifier, true)
                }

                if ((Date.now() - this.lastOutage.time) > 180000 && !this.lastOutage._alertSentOrExpired) {
                    this.SendAlertMessage(this.lastOutage)
                }
            } else this.SaveOutage(serviceStatuses, outageIdentifier)
        } else {
            if (!this.lastOutage?.end) this.SaveOutage(new Map(Object.entries(this.lastOutage.services)), this.lastOutage.identifier, true, true)
        }

        if (!this.recentObfuscations.time || (Date.now() - this.recentObfuscations.time) > 300000) {
            this.recentObfuscations.difference = this.recentObfuscations.old ? serverStatistics.total_obfuscations - this.recentObfuscations.old : 0
            this.recentObfuscations.old = serverStatistics.total_obfuscations
            this.recentObfuscations.time = Date.now()
        }

        this.mainEmbed.setColor(failedServices.size > 0 ? Colors.Red : Colors.Green)
        this.statisticsEmbed.setImage(Chart.Create(await ObfuscatorStats.Parse()).toString())

        Fields.SetValue(this.mainEmbed.data.fields, Fields.Indexes.Main.LastUpdated, this.lastUpdate ? `<t:${(this.lastUpdate / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(this.mainEmbed.data.fields, Fields.Indexes.Main.LastOutage, this.lastOutage ? `<t:${(this.lastOutage.time / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(this.mainEmbed.data.fields, Fields.Indexes.Main.Statistics.serverUptime, serverStatistics ? Utils.FormatUptime(Date.now() - new Date(serverStatistics.start_time).getTime(), true) : "N/A")
        Fields.SetValue(this.mainEmbed.data.fields, Fields.Indexes.Main.Statistics.memoryUsage, serverStatistics ? Utils.FormatBytes(serverStatistics.memory_usage) : "N/A")
        Fields.SetValue(this.mainEmbed.data.fields, Fields.Indexes.Main.Statistics.botUptime, client ? Utils.FormatUptime(client.uptime, true) : "N/A")
        Fields.SetValue(this.statisticsEmbed.data.fields, Fields.Indexes.Stats.totalObfuscations, serverStatistics ? Utils.FormatNumber(serverStatistics.total_obfuscations) : "N/A")
        Fields.SetValue(this.statisticsEmbed.data.fields, Fields.Indexes.Stats.recentObfuscations, this.recentObfuscations.difference?.toString() || "N/A")

        if (ENV === "prod") {
            ObfuscatorStats.Update({
                total_uploads: serverStatistics.total_file,
                total_obfuscations: serverStatistics.total_obfuscations,
                time: Date.now(),
                date: Utils.ToLocalizedDateString(new Date(), true)
            }).catch(console.error)
        }

        await this.statusMessage.edit({
            embeds: [this.mainEmbed, this.statisticsEmbed],
            components: [new ActionRowBuilder<ButtonBuilder>().addComponents(this.outageHistoryButton).toJSON()],
        });
    }

    GetStatusEmoji(statusCode: number | string) {
        return statusCode == 200 ? Utils.GetEmoji("online") : Utils.GetEmoji("offline")
    }

    CreateOutageIdentifier(services: Map<string, ServiceStatus>, length = 12) {
        return createHash('sha256').update(
            JSON.stringify(Array.from(new Set(Array.from(services.values()).map(s => s.statusText))).sort())
        ).digest('hex').slice(0, length)
    }

    async SaveOutage(services: Map<string, ServiceStatus>, outageIdentifier: string, replaceLast = false, ended = false) {
        if (ENV === "dev" || (this.lastOutage?.identifier === outageIdentifier && !replaceLast && !ended)) return

        if (ended) {
            this.lastOutage.end = Date.now()

            await Database.Update("outage_log", {
                end: this.lastOutage.end
            }, { oid: this.lastOutage.oid })
            return
        }

        if (replaceLast) {
            this.lastOutage.services = Object.fromEntries(services)

            await Database.Update("outage_log", {
                services: JSON.stringify(this.lastOutage.services),
                time: this.lastOutage.time,
                identifier: outageIdentifier,
                oid: this.lastOutage.oid,
            }, { identifier: this.lastOutage.oid })
        } else {
            this.lastOutage = {
                time: Date.now(),
                services: Object.fromEntries(services),
                identifier: outageIdentifier,
                oid: randomUUID(),
                _alertSentOrExpired: false,
            }

            await Database.Insert("outage_log", {
                time: this.lastOutage.time,
                services: JSON.stringify(this.lastOutage.services),
                identifier: outageIdentifier,
                oid: this.lastOutage.oid
            })
        }
    }

    async GetOutage(id?: string): Promise<ServiceOutage> {
        const result = await Database.GetTable<ServiceOutage>("outage_log", id ? { oid: id } : null, id === undefined)

        if (!result.success) {
            console.error("[Status Display Database Error]:", result.error.message)
            return
        }
        return {
            time: parseInt(result.data.time?.toString()),
            end: result.data.end && parseInt(result.data.end?.toString()),
            services: JSON.parse(result.data.services.toString()) ?? {},
            identifier: result.data.identifier,
            oid: result.data.oid,
            _alertSentOrExpired: result.data.end ? (result.data.end - result.data.time) > 180000 : (Date.now() - result.data.time) > 300000,
        }
    }

    async SendAlertMessage(outage: ServiceOutage) {
        if (this.alertChannel && outage) {
            const alertEmbed = Embed(Alert())

            new Map(Object.entries(outage?.services)).forEach((serviceStatus, serviceName) => {
                if (!Fields.Indexes.Main.Services[serviceName]) return

                Fields.SetValue(
                    alertEmbed.data.fields,
                    Fields.Indexes.Alert.Services[serviceName],
                    `${this.GetStatusEmoji(serviceStatus.statusCode)} ${serviceStatus.statusText}\n-# ${serviceStatus.ping}ms`
                )
            })

            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.Other.outageStartTime, outage.time ? `<t:${(outage.time / 1000).toFixed()}:R>` : "N/A")
            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.Other.outageEndTime, outage.end ? `<t:${(outage.end / 1000).toFixed()}:R>` : "N/A")
            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.Other.outageDuration, outage.end ? `${Utils.FormatUptime(outage.end - outage.time)}` : "N/A")
            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.Other.outageId, outage.oid || "N/A")

            this.lastOutage._alertSentOrExpired = true
            this.alertChannel.send({ embeds: [alertEmbed], content: config.STATUS_DISPLAY.ids_to_alert.map(id => `<@${id}>`).join(' ') })
        }
    }

    async CreateOutageHistory(interaction: ButtonInteraction) {
        if (this._cache[interaction.user.id]) return await interaction.reply(this._cache[interaction.user.id]).catch(console.error)

        const result = await Database.GetTable<ServiceOutage[]>("outage_log", null, null, 10, true),
            historyEmbed = Embed(History()),
            fieldValues = {
                services: "",
                status: "",
                time: ""
            }

        if (!result.success) {
            await interaction.reply({ flags: [MessageFlags.Ephemeral], content: "An error occurred while trying to fetch the outage history!" })
            return console.error(result.error.message)
        }

        const session = await Session.CreateV2(300, interaction.user),
            outage_log = result.data.map(outage => {
                outage.services = JSON.parse(outage.services.toString())
                return outage
            })

        outage_log.forEach(outage => {
            const affectedServices = Object.entries(outage.services)
                .filter(([_, service]) => !service.ok)
                .map(([key]) => key),
                firstService = outage.services[Object.values(affectedServices)[0]]

            fieldValues.services += `-# ${affectedServices.join(", ")}\n`
            fieldValues.status += `-# ${firstService?.statusText || "N/A"} (_${firstService?.statusCode || "N/A"}_)\n`
            fieldValues.time += `-# <t:${Math.floor(outage.time / 1000)}:R>\n`
        })

        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.services, fieldValues.services, true)
        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.status, fieldValues.status, true)
        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.time, fieldValues.time, true)
        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.website, `You can see the full outage history with more informations on the [website](${ENV == "prod" ? process.env.SERVER : "http://localhost:6969"}/outagehistory?s=${session.session}).`)

        this._cache[interaction.user.id] = { flags: [MessageFlags.Ephemeral], embeds: [historyEmbed] }
        await interaction.reply({ flags: [MessageFlags.Ephemeral], embeds: [historyEmbed] })

        Utils.Sleep(60000).then(() => {
            this._cache[interaction.user.id] = false
        })
    }
}