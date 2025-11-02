// TODO: fix discord 1024 field length limit (split into multiple fields)

import { Colors, PermissionFlagsBits } from "discord.js";
import { Command, CommandNode } from "../modules/CommandHandler"
import { commandHandler } from "../index";
import Embed from "../modules/Misc/Embed";
import config from "../config";
import Utils from "../modules/Utils";
import Services from "../modules/StatusDisplay/Services";
import LuaObfuscator from "../modules/LuaObfuscator/API"

const visibleLength = (text: string) => text.replace(/\x1b\[[0-9;]*m/g, '').length;
const padRight = (text: string, width: number) => {
    return text + ' '.repeat(Math.max(0, width - text.replace(/\x1b\[[0-9;]*m/g, '').length));
};

class CommandConstructor implements CommandNode {
    name = ["servicecheck", "sc", "svc"]
    category = commandHandler.CommandCategories.Misc
    description = "Runs a full service check process to see if there are any issues."
    permissions = [PermissionFlagsBits.Administrator]

    callback = async (command: Command) => {
        const process = [Utils.ToAnsiColor("> receiving service statuses...", "yellow")],
            process2 = []
        let fails = 0

        const simulateFailedService = command.arguments[0] === "simulatefail",
            simulatedStatusCode = command.arguments[1] || 502

        const embed = Embed({
            title: "Lua Obfuscator - Service Check",
            color: Colors.Yellow,
            timestamp: true,
            footer: {
                iconURL: config.icon_url,
                text: "Lua Obfuscator"
            },
            fields: [
                { name: "Status:", value: "-# ONGOING", inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "Result:", value: `${Utils.GetEmoji("loading")}`, inline: true },
                {
                    name: "Process:", value: Utils.ToAnsiCodeBlock(process.join("\n")), inline: false
                }
            ]
        })

        const reply = await command.message.reply({ embeds: [embed] }),
            _serviceCheckTime = Date.now()

        // 1. Service Status Test
        await Services.GetStatuses(simulateFailedService, simulatedStatusCode).then(async ([serviceStatuses, failedServices]) => {
            const rows = [
                { name: 'homepage', data: serviceStatuses.get("homepage") },
                { name: 'api', data: serviceStatuses.get("api") },
                { name: 'forum', data: serviceStatuses.get("forum") },
            ], // idk what i did here. theres prob a way to make it cleaner. but it works :3
                longestStatusLength = Math.max(...rows.map(({ data }) => visibleLength(data.statusText + (data.ok ? '' : ' (failed)')))),
                header = Utils.ToAnsiColor(`     Service        Status${" ".repeat(Math.max((longestStatusLength / 2) + 2, 5))}Ping`, 'black')

            const formattedRows = rows.map(({ name, data }) => {
                const serviceName = Utils.ToAnsiColor(name, 'white'),
                    status = Utils.ToAnsiColor(data.statusText, data.ok ? 'green' : 'red'),
                    ping = Utils.ToAnsiColor(`${data.ping}ms`, 'blue')

                return Utils.ToAnsiColor(`     ${padRight(serviceName, 14)} ${padRight(status, (Math.max((longestStatusLength / 2) + 2, 5)) + 5)} ${ping}${data.ok ? "" : Utils.ToAnsiColor(" (failed)", "red")}`, 'green');
            });

            fails += failedServices.size
            process.push(
                Utils.ToAnsiColor(
                    `> service statuses received! ${Utils.ToAnsiColor("(" + (Date.now() - _serviceCheckTime) + "ms)" + Utils.ToAnsiColor(" (" + failedServices.size + " failed)", "red"), "blue")}`,
                    "green"
                ),
                header,
                ...formattedRows,
                Utils.ToAnsiColor(`> receiving statistics...`, "yellow"),
            );
        }).catch(err => {
            process.push(
                Utils.ToAnsiColor(`> failed receiving service statuses!`, "red"),
                Utils.ToAnsiColor(`     ${err}`, "red"),
            )
            console.error(err)
        })

        embed.data.fields[3].value = Utils.ToAnsiCodeBlock(process.join("\n"))
        await reply.edit({ embeds: [embed] })

        // 2. Statistics Test
        const _statisticsCheckTime = Date.now()
        await Services.GetStatistics().then(statistics => {
            if (statistics.error) return process.push(Utils.ToAnsiColor(`> failed receiving statistics!`, "red"), Utils.ToAnsiColor(`     > ${statistics.error}`, "red"))

            const header = Utils.ToAnsiColor("     Memory        Obfuscations     Uptime", "black"),
                row = `     ${padRight(Utils.ToAnsiColor(Utils.FormatBytes(statistics.memory_usage), "magenta"), 14)}` +
                    `${padRight(Utils.ToAnsiColor(Utils.FormatNumber(statistics.total_obfuscations), "magenta"), 17)}` +
                    `${Utils.ToAnsiColor(Utils.FormatUptime(Date.now() - new Date(statistics.start_time).getTime(), true), "cyan")}`

            process.push(
                Utils.ToAnsiColor(`> statistics received! ${Utils.ToAnsiColor("(" + (Date.now() - _statisticsCheckTime) + "ms)", "blue")}`, "green"),
                header, row
            )
        }).catch(err => {
            process.push(
                Utils.ToAnsiColor(`> failed receiving statistics!`, "red"),
                Utils.ToAnsiColor(`     ${err}`, "red"),
            )
            fails += 1
            console.error(err)
        })

        embed.data.fields[3].value = Utils.ToAnsiCodeBlock(process.join("\n"))
        await reply.edit({ embeds: [embed] })

        // 3. Obfuscation Process V1 Test
        embed.addFields({ name: "\u200B", value: "\u200B", inline: false })
        process2.push(Utils.ToAnsiColor("> testing v1 obfuscation process...", "yellow"))
        embed.data.fields[4].value = Utils.ToAnsiCodeBlock(process2.join("\n"))
        await reply.edit({ embeds: [embed] })

        const _sessionCreateTime = Date.now()
        const sessionIdV1 = await LuaObfuscator.v1.CreateSession(`print("Hello World")`).then(res => {
            if (!res.sessionId) {
                process2.push(Utils.ToAnsiColor(`    > failed creating v1 session! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV1ConfigTime) + "ms)", "blue")}`, "red"))
                fails += 1
                return
            } else {
                process2.push(
                    Utils.ToAnsiColor(`    > session successfully created! ${Utils.ToAnsiColor("(" + (Date.now() - _sessionCreateTime) + "ms)", "blue")}`, "green"),
                    Utils.ToAnsiColor("    > obfuscating script with custom config...", "yellow")
                )
            }

            return res.sessionId
        })

        embed.data.fields[4].value = Utils.ToAnsiCodeBlock(process2.join("\n"))
        await reply.edit({ embeds: [embed] })

        // 3.1 Obfuscation Process V1 Test - Config Obfuscation
        const _obfuscateV1ConfigTime = Date.now()
        await LuaObfuscator.v1.Obfuscate(null, sessionIdV1, { MinifiyAll: true, Virtualize: true }).then(res => {
            if (!res.code) {
                process2.push(
                    Utils.ToAnsiColor(`        > obfuscation failed! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV1ConfigTime) + "ms)", "blue")}`, "red"),
                    Utils.ToAnsiColor(`        > Error: ${res.message || "unknown error"}`, "red"),
                    Utils.ToAnsiColor("    > obfuscating script with default preset...", "yellow")
                )
                fails += 1
                return
            }

            process2.push(
                Utils.ToAnsiColor(`        > obfuscation successfull! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV1ConfigTime) + "ms)", "blue")}`, "green"),
                Utils.ToAnsiColor("    > obfuscating script with default preset...", "yellow")
            )
        })

        embed.data.fields[4].value = Utils.ToAnsiCodeBlock(process2.join("\n"))
        await reply.edit({ embeds: [embed] })

        // 3.2 Obfuscation Process V1 Test - Default Preset
        const _obfuscateV1DefaultPresetTime = Date.now()
        await LuaObfuscator.v1.Obfuscate(`print("Hello World")`).then(res => {
            if (!res.code) {
                process2.push(
                    Utils.ToAnsiColor(`        > obfuscation failed! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV1ConfigTime) + "ms)", "blue")}`, "red"),
                    Utils.ToAnsiColor(`        > Error: ${res.message || "unknown error"}`, "red")
                )
                fails += 1
                return
            }

            process2.push(
                Utils.ToAnsiColor(`        > obfuscation successfull! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV1DefaultPresetTime) + "ms)", "blue")}`, "green")
            )
        })

        process2[0] = process2[0] + Utils.ToAnsiColor(` (${Date.now() - _sessionCreateTime}ms)`, "blue")
        embed.data.fields[4].value = Utils.ToAnsiCodeBlock(process2.join("\n"))
        await reply.edit({ embeds: [embed] })

        // 4. Obfuscation Process V2 Test - Initiate Obfuscation
        const v2TestIndex = process2.push(Utils.ToAnsiColor("> testing v2 obfuscation process...", "yellow")) - 1
        embed.data.fields[4].value = Utils.ToAnsiCodeBlock(process2.join("\n"))
        await reply.edit({ embeds: [embed] })

        const _obfuscateV2ObfuscateTime = Date.now()
        const sessionIdV2 = await LuaObfuscator.v2.Obfuscate(`print("Hello World")`, { MinifiyAll: true, Virtualize: true }).then(res => {
            if (!res.sessionId) {
                process2.push(
                    Utils.ToAnsiColor(`        > obfuscation failed! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV2ObfuscateTime) + "ms)", "blue")}`, "red"),
                    Utils.ToAnsiColor(`        > Error: ${res.message || "unknown error"}`, "red")
                )
                fails += 1
                return
            }

            process2.push(
                Utils.ToAnsiColor(`    > obfuscation initiated! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV2ObfuscateTime) + "ms)", "blue")}`, "green"),
                Utils.ToAnsiColor("    > receiving obfuscation results...", "yellow")
            )

            return res.sessionId
        })

        embed.data.fields[4].value = Utils.ToAnsiCodeBlock(process2.join("\n"))
        await reply.edit({ embeds: [embed] })

        const _obfuscateV2GetStatusTime = Date.now()
        if (sessionIdV2) {
            await LuaObfuscator.v2.GetStatus(sessionIdV2).then(res => {
                if (!res.code) {
                    process2.push(
                        Utils.ToAnsiColor(`        > obfuscation failed! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV2GetStatusTime) + "ms)", "blue")}`, "red"),
                        Utils.ToAnsiColor(`        > Error: ${res.message || "unknown error"}`, "red")
                    )
                    fails += 1
                    return
                }

                process2.push(
                    Utils.ToAnsiColor(`        > obfuscation successfull! ${Utils.ToAnsiColor("(" + (Date.now() - _obfuscateV2GetStatusTime) + "ms)", "blue")}`, "green")
                )
            })
        }

        process2[v2TestIndex] = process2[v2TestIndex] + Utils.ToAnsiColor(` (${Date.now() - _obfuscateV2ObfuscateTime}ms)`, "blue")
        embed.data.fields[4].value = Utils.ToAnsiCodeBlock(process2.join("\n"))
        embed.data.fields[0].value = "-# FINISHED"
        embed.data.fields[2].value = `-# ${fails} failed`
        embed.setColor("Green")
        await reply.edit({ embeds: [embed] })
    }
}

module.exports = CommandConstructor