import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChannelType, Colors, ComponentType, EmbedBuilder, InteractionCollector, Message, MessageFlags, TextChannel } from "discord.js";
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

        public lastUpdate: number = 0,
        public lastOutage: ServiceOutage = null,

        public statusResults = new Map<string, ServiceStatus>(),

        public _initTime: number = 0,
        public _cache: { [id: string]: boolean } = null
    ) { }

    async init() {
        this._initTime = Date.now()
        this._cache = {}
        this.mainEmbed = Embed(Main())
        this.statisticsEmbed = Embed(Stats())

        await client.channels.fetch(config[ENV].STATUS_CHANNEL_ID).then(async channel => {
            if (channel.type !== ChannelType.GuildText) return console.error(`[Status Display Error]: status channel '${channel.id}' must be textBased.`)
            this.statusChannel = channel
            this.statusMessage = (await this.statusChannel.messages.fetch()).first()
        }).catch(err => {
            console.error(`[Status Display Error]:`, err)
        })

        await client.channels.fetch(config.STATUS_DISPLAY.alert_channel).then(channel => {
            if (channel.type !== ChannelType.GuildText) return console.error(`[Status Display Error]: alert channel '${channel.id}' must be textBased.`)
            this.alertChannel = channel
        }).catch(err => {
            console.error(`[Status Display Error]:`, err)
        })

        this.outageHistoryButton = new ButtonBuilder().setLabel("Outage History").setCustomId("outage_history").setStyle(ButtonStyle.Secondary).setEmoji(`<:history:1419671276875939981>`)
        this.interactionCollector = this.statusMessage.createMessageComponentCollector({ componentType: ComponentType.Button })
        this.lastOutage = await this.GetLastOutage();

        this.interactionCollector.on("collect", this.CreateOutageHistory.bind(this));

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

        this.statusResults = serviceStatuses
        serviceStatuses.forEach((serviceStatus, serviceName) => {
            if (!Fields.Indexes.Main.Services[serviceName]) return

            Fields.SetValue(
                mainEmbed.data.fields,
                Fields.Indexes.Main.Services[serviceName],
                `${this.GetStatusEmoji(serviceStatus.statusCode)} ${serviceStatus.statusText} - ${serviceStatus.ping}ms`
            )
        })

        if (failedServices.size > 0) {
            const outageIdentifier = this.CreateOutageIdentifier(failedServices)

            if (this.lastOutage?.identifier === outageIdentifier && (Date.now() - this.lastOutage.time) < 1800000) {
                if (this.lastOutage.count === 3) {
                    this.SendAlertMessage(failedServices, outageIdentifier)
                }

                this.lastOutage.count += 1

                if ([...failedServices.keys()].length > Object.keys(this.lastOutage.services).length) {
                    this.SaveOutage(failedServices, outageIdentifier, true).catch(err => console.error("[Status Display Error]:", err))
                }
            } else {
                this.SaveOutage(failedServices, outageIdentifier).catch(err => console.error("[Status Display Error]:", err))
            }
        } else {
            this.lastOutage = await this.GetLastOutage()
        }

        this.lastUpdate = Date.now()
        mainEmbed.setColor(failedServices.size > 0 ? Colors.Red : Colors.Green)
        statisticsEmbed.setImage(Chart.Create(await ObfuscatorStats.Parse()).toString())

        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.LastUpdated, this.lastUpdate ? `<t:${(this.lastUpdate / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.LastOutage, this.lastOutage ? `<t:${(this.lastOutage.time / 1000).toFixed()}:R>` : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.serverUptime, serverStatistics ? Utils.FormatUptime(Date.now() - new Date(serverStatistics.start_time).getTime(), true) : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.memoryUsage, serverStatistics ? Utils.FormatBytes(serverStatistics.memory_usage) : "N/A")
        Fields.SetValue(mainEmbed.data.fields, Fields.Indexes.Main.Statistics.botUptime, client ? Utils.FormatUptime(client.uptime, true) : "N/A")
        Fields.SetValue(statisticsEmbed.data.fields, Fields.Indexes.Stats.totalObfuscations, serverStatistics ? Utils.FormatNumber(serverStatistics.total_obfuscations) : "N/A")
        Fields.SetValue(statisticsEmbed.data.fields, Fields.Indexes.Stats.recentObfuscations, "N/A")

        if (ENV === "prod") {
            ObfuscatorStats.Update({
                total_uploads: serverStatistics.total_file,
                total_obfuscations: serverStatistics.total_obfuscations,
                time: Date.now(),
                date: Utils.ToLocalizedDateString(new Date(), true)
            }).catch(console.error)
        }

        await this.statusMessage.edit({
            embeds: [mainEmbed, statisticsEmbed],
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(this.outageHistoryButton).toJSON()
            ],
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

    async SaveOutage(services: Map<string, ServiceStatus>, outageIdentifier: string, replaceLast = false) {
        if (ENV === "dev" || (this.lastOutage?.identifier == outageIdentifier && !replaceLast)) return

        this.lastOutage = {
            time: replaceLast ? this.lastOutage.time : Date.now(),
            services: Object.fromEntries(services),
            identifier: outageIdentifier,
            oid: randomUUID(),
            count: 0,
        }

        if (replaceLast) {
            await Database.Update("outage_log", {
                time: this.lastOutage.time,
                services: JSON.stringify(Object.fromEntries(services)),
                identifier: outageIdentifier,
                oid: this.lastOutage.oid
            }, { identifier: outageIdentifier })
        } else {
            await Database.Insert("outage_log", {
                time: this.lastOutage.time,
                services: JSON.stringify(Object.fromEntries(services)),
                identifier: outageIdentifier,
                oid: this.lastOutage.oid,
            })
        }
    }

    async GetLastOutage(): Promise<ServiceOutage> {
        const result = await Database.GetTable<ServiceOutage>("outage_log", null, true)

        if (!result.success) {
            console.error("[Status Display Database Error]:", result.error.message)
            return
        }

        return {
            time: result.data.time,
            services: JSON.parse(result.data.services.toString()) ?? {},
            identifier: result.data.identifier,
            oid: result.data.oid,
            count: 0
        }
    }

    async SendAlertMessage(failedServices: Map<string, ServiceStatus>, outageId: string) {
        if (this.alertChannel) {
            let alertEmbed = Embed(Alert()),
                affected_services = []

            failedServices.forEach((serviceStatus, serviceName) => {
                affected_services.push(`${Utils.GetEmoji("offline")} **${serviceName}: \`${serviceStatus.statusText} (${serviceStatus.statusCode}) | ${serviceStatus.ping}ms\`**`)
            })

            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.affectedServices, affected_services.join("\n-# "))
            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.outageTime, new Date().toUTCString())
            Fields.SetValue(alertEmbed.data.fields, Fields.Indexes.Alert.outageId, outageId)

            this.alertChannel.send({ embeds: [alertEmbed], content: config.STATUS_DISPLAY.ids_to_alert.map(id => `<@${id}>`).join(' ') })
        }
    }

    async CreateOutageHistory(interaction: ButtonInteraction) {
        if (this._cache[interaction.user.id]) return await interaction.reply({ flags: [MessageFlags.Ephemeral], content: "Please wait a few seconds..." })
        this._cache[interaction.user.id] = true

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
            const firstService = Object.values(outage.services)[0]

            fieldValues.services += `-# ${Object.keys(outage.services).join(", ")}\n`;
            fieldValues.status += `-# ${firstService?.statusText || "N/A"} (_${firstService?.statusCode || "N/A"}_)\n`;
            fieldValues.time += `-# <t:${Math.floor(outage.time / 1000)}:R>\n`;
        });

        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.services, fieldValues.services, true)
        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.status, fieldValues.status, true)
        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.time, fieldValues.time, true)
        Fields.SetValue(historyEmbed.data.fields, Fields.Indexes.OutageHistory.website, `You can see the full outage history on the [website](${ENV == "prod" ? process.env.SERVER : "http://localhost:6969"}/outagehistory?s=${session.session}).`)

        await interaction.reply({ flags: [MessageFlags.Ephemeral], embeds: [historyEmbed] })

        Utils.Sleep(10000).then(() => {
            this._cache[interaction.user.id] = false
        })
    }
}