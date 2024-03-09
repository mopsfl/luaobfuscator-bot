// todo: when selecting to custom plugins, use default obfuscation. only create session when using customize plugins.
//       fix continue not switching sessions when using default obfuscate first

import { ActionRowBuilder, AttachmentBuilder, bold, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, Colors, ComponentType, hyperlink, inlineCode, quote, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";

const _plugins = [
    { label: "MinifyAll", description: `This results in all code on a single line, no comments..`, value: "MinifiyAll" },
    { label: "Virtualize", description: `Makes the final code virtualized.`, value: "Virtualize" },
    { label: "EncryptStrings", description: `Encrypts strings into something like local foo = v8('\\x42..')`, value: "EncryptStrings" },
    { label: "MutateAllLiterals", description: `Mutates all numeric literals into basic +/- binary nodes.`, value: "MutateAllLiterals" },
    { label: "MixedBooleanArithmetic", description: `Mutates literals into mixed boolean arithmerics.`, value: "MixedBooleanArithmetic" },
    { label: "JunkifyAllIfStatements", description: `Injects opaque conditions into the if statement.`, value: "JunkifyAllIfStatements" },
    { label: "JunkifyBlockToIf", description: `Turns do/end blocks into opaque if statements.`, value: "JunkifyBlockToIf" },
    { label: "RevertAllIfStatements", description: `This will invert all if statements to create funny looking ones.`, value: "RevertAllIfStatements" },
    { label: "ControlFlowFlattenAllBlocks", description: `Injects basic while loops with a state counter.`, value: "ControlFlowFlattenV1AllBlocks" },
    { label: "EncryptFuncDeclaration", description: `Turns the declaration of a (global) function into an encrypted string.`, value: "EncryptFuncDeclaration" },
    { label: "SwizzleLookups", description: `Swizzle lookups, will turn foo.bar into foo['bar'].`, value: "SwizzleLookups" },
    { label: "TableIndirection", description: `Replaces local variables with a table, each varaible is mapped to a table index.`, value: "TableIndirection" },
    { label: "MakeGlobalsLookups", description: `Turns all the globals explicity into these kind if lookups: _G['foo']`, value: "MakeGlobalsLookups" },
    { label: "BasicIntegrity", description: `Adds basic integrity checks into the script.`, value: "BasicIntegrity" },
    { label: "WriteLuaBit32", description: `Addes the 'bit32' in pura Lua for compatibility.`, value: "WriteLuaBit32" },
], plugin_presets = {
    "EncryptStrings": [100],
    "MutateAllLiterals": [100],
    "MixedBooleanArithmetic": [100],
    "JunkifyAllIfStatements": [100],
    "JunkifyBlockToIf": [100],
    "ControlFlowFlattenV1AllBlocks": [100],
    "EncryptFuncDeclaration": true,
    "SwizzleLookups": [100],
    "TableIndirection": [100],
    "RevertAllIfStatements": [100],
    "MakeGlobalsLookups": true,
    "BasicIntegrity": true,
    "WriteLuaBit32": true,
    "Virtualize": true,
    "MinifiyAll": true,
}, _isObfuscating = []


class Command {
    name = ["customobfuscate", "co", "cobf"]
    category = self.commandCategories.LuaObfuscator
    description = "Obfuscates your given input using the REST API with your selected options."
    syntax_usage = "<file | codeblock>"

    callback = async (cmd: cmdStructure) => {
        if (!cmd.message.channel.isDMBased()) {
            const peepoemojis = ["peepositnerd", "peepositchair", "peepositbusiness", "peepositsleep", "peepositmaid", "peepositsuit", "monkaS"]
            await cmd.message.reply(`no, use website: ${bold(self.config.STATUS_DISPLAY.endpoints.homepage)} or slide in my dms ${GetEmoji(peepoemojis[Math.floor(Math.random() * peepoemojis.length)])}`)
            return true
        }

        if (_isObfuscating[cmd.message.author.id] === true) {
            return self.utils.SendErrorMessage("ratelimit", cmd, null)
        }
        _isObfuscating[cmd.message.author.id] = true

        let script_content = "",
            session = "",
            chunksAmount = 0,
            hasWebhook = false,
            hasCodeBlock = self.utils.hasCodeblock(cmd.raw_arguments),
            file_attachment: AttachmentBuilder

        // Get Script Content
        if (hasCodeBlock) {
            hasWebhook = self.utils.hasWebhook(cmd.raw_arguments)
            script_content = self.utils.parseCodeblock(cmd.raw_arguments)
        } else if ([...cmd.message.attachments].length > 0) {
            const attachment = cmd.message.attachments.first()
            const url = attachment?.url
            if (!url) self.utils.SendErrorMessage("error", cmd, "Unable to get url from attachment.")
            await fetch(url).then(async res => {
                const chunks = await self.utils.readAllChunks(res.body)
                chunksAmount = chunks.length
                chunks.forEach(chunk => {
                    script_content += Buffer.from(chunk).toString() || ""
                })
            })
        } else {
            _isObfuscating[cmd.message.author.id] = false
            return self.utils.SendErrorMessage("syntax", cmd, "Please provide a valid Lua script as a codeblock or a file.", null, [
                { name: "Syntax:", value: inlineCode(`${self.config.prefix}${cmd.used_command_name} <codeblock> | <file>`), inline: false },
                { name: "Reminder:", value: `If you need help, you may ask in <#1128990603087200276> for assistance.`, inline: false }
            ])
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId("select_plugins")
            .setPlaceholder("Select an option")
            .setOptions(_plugins)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Back')
                    .setValue('back')
                    .setEmoji("<:update:1129139085362090145>")
            ),
            obfuscate = new ButtonBuilder()
                .setLabel("Obfuscate")
                .setCustomId("obfuscate")
                .setEmoji("<:update:1129139085362090145>")
                .setStyle(ButtonStyle.Success),
            options = new ButtonBuilder()
                .setLabel("Customize Plugins")
                .setCustomId("options")
                .setStyle(ButtonStyle.Primary),
            cancel = new ButtonBuilder()
                .setLabel("Cancel")
                .setCustomId("cancel")
                .setStyle(ButtonStyle.Danger),
            continueObf = new ButtonBuilder()
                .setLabel("Continue obfuscation")
                .setCustomId("continue")
                .setStyle(ButtonStyle.Success)

        const embed_main = self.Embed({
            color: Colors.Green,
            timestamp: true,
            title: "Custom Obfuscation",
            description: `${GetEmoji("yes")} Script session created!`,
            fields: [
                { name: "Script Session:", value: "> " + inlineCode("N/A"), inline: false },
                { name: "Selected Plugins:", value: inlineCode("Default"), inline: false },
                { name: "Documentation:", value: `Read our documentation for more information about each plugin.\n${hyperlink("Documentation", self.config.STATUS_DISPLAY.endpoints.forum + "/docs#plugins")}`, inline: false },
            ],
            footer: {
                text: `Lua Obfuscator Bot`,
                iconURL: self.config.icon_url,
            }
        }), embed_loading = self.Embed({
            color: Colors.Yellow,
            timestamp: true,
            title: "Custom Obfuscation",
            description: `${GetEmoji("loading")} Creating script session...`,
            footer: {
                text: `Lua Obfuscator Bot`,
                iconURL: self.config.icon_url,
            }
        })

        let selected_plugins = { MinifiyAll: false, Virtualize: false, CustomPlugins: {} }

        try {
            let row_buttons: any = new ActionRowBuilder().addComponents(obfuscate, options, cancel),
                row_buttons2: any = new ActionRowBuilder().addComponents(continueObf),
                row_plugins: any = new ActionRowBuilder().addComponents(select),
                response = await cmd.message.reply({ embeds: [embed_loading] }),
                collector_mainButtons = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 })

            self.utils.NewPromise(60000, async (resolve: Function, reject: Function) => {
                await self.utils.createSession(script_content).then(async _response => {
                    console.log(`created new script session ${_response.sessionId}`);

                    resolve();
                    session = _response.sessionId
                    embed_main.data.fields[0].value = inlineCode(session)
                    response.edit({ components: [row_buttons], embeds: [embed_main] })
                    console.log(session);
                    collector_mainButtons.on("end", () => {
                        _isObfuscating[cmd.message.author.id] = false
                    })
                    collector_mainButtons.on("collect", async i => {
                        if (i.user.id !== cmd.message.author.id) {
                            i.deferUpdate()
                            return;
                        }
                        switch (i.customId) {
                            case "obfuscate":
                                i.deferUpdate()
                                row_buttons.components.forEach((c: ButtonBuilder) => {
                                    c.setDisabled(true)
                                    if (c.data.label === "Obfuscate") c.setEmoji("<:loading:1135544416933785651>").setLabel(" ")
                                })
                                embed_main.setColor(Colors.Yellow).setDescription(`${GetEmoji("yes")} Script session created!\n${GetEmoji("loading")} Obfuscating script! Please wait...`)
                                await response.edit({ components: [row_buttons], embeds: [embed_main] })
                                // todo: make this smaller
                                if (embed_main.data.fields[1].value === "`Default`") {
                                    await self.utils.obfuscateScript(script_content, cmd.message).then(async res => {
                                        if (!res?.code) {
                                            embed_main.setColor(Colors.Red).setDescription(`${GetEmoji("yes")} Script session created!\n${GetEmoji("no")} Error while obfuscating script!`)
                                            self.utils.SendErrorMessage("error", cmd, res?.message, "Obfuscation Error")
                                            response.edit({ embeds: [embed_main], components: [] })
                                            _isObfuscating[cmd.message.author.id] = false
                                            return
                                        }

                                        script_content = res?.code
                                        session = res?.sessionId
                                        console.log(session);
                                        file_attachment = self.utils.createFileAttachment(Buffer.from(res?.code), `${session}.lua`)
                                        await response.edit({
                                            files: [file_attachment],
                                            components: [row_buttons2],
                                            embeds: []
                                        })
                                        _isObfuscating[cmd.message.author.id] = false
                                    })
                                } else {
                                    await self.utils.manualObfuscateScript(session, selected_plugins).then(async res => {
                                        if (!res?.code) {
                                            embed_main.setColor(Colors.Red).setDescription(`${GetEmoji("yes")} Script session created!\n${GetEmoji("no")} Error while obfuscating script!`)
                                            self.utils.SendErrorMessage("error", cmd, res?.message, "Obfuscation Error")
                                            response.edit({ embeds: [embed_main], components: [] })
                                            _isObfuscating[cmd.message.author.id] = false
                                            return
                                        }

                                        script_content = res?.code
                                        file_attachment = self.utils.createFileAttachment(Buffer.from(res?.code), `${session}.lua`)
                                        await response.edit({
                                            files: [file_attachment],
                                            components: [row_buttons2],
                                            embeds: []
                                        })
                                        _isObfuscating[cmd.message.author.id] = false
                                    })
                                }
                                break;
                            case "cancel":
                                embed_main.data.fields = []
                                embed_main.setDescription("Obfuscation cancelled.").setColor(Colors.Red).setTitle(" ")
                                response.edit({ components: [], embeds: [embed_main] }).then(() => setTimeout(() => response.deletable && response.delete(), 5000))
                                collector_mainButtons.stop()
                                _isObfuscating[cmd.message.author.id] = false
                                break;
                            case "options":
                                i.deferUpdate()
                                var response_plugins = await response.edit({ components: [row_plugins] }),
                                    collector_plugins = response_plugins.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_00 })

                                collector_plugins.on("collect", async i_plugins => {
                                    if (i_plugins.user.id !== cmd.message.author.id) {
                                        i_plugins.deferUpdate()
                                        return;
                                    }
                                    const selection = i_plugins.values[0]
                                    switch (selection) {
                                        case "back":
                                            response.edit({ components: [row_buttons] })
                                            await i_plugins.deferUpdate()
                                            collector_plugins.stop()
                                            break;
                                        default:
                                            const optionIndex = select.options.findIndex(o => o.data.value === selection)
                                            select.spliceOptions(optionIndex, 1)

                                            row_plugins = new ActionRowBuilder().addComponents(select)
                                            if (embed_main.data.fields[1].value === "`Default`") embed_main.data.fields[1].value = ""
                                            embed_main.data.fields[1].value = embed_main.data.fields[1].value + `\n> ${inlineCode(selection)}`
                                            if (selected_plugins[selection] !== undefined) {
                                                selected_plugins[selection] = plugin_presets[selection]
                                            } else {
                                                selected_plugins.CustomPlugins[selection] = plugin_presets[selection]
                                            }

                                            response.edit({ embeds: [embed_main], components: [row_plugins] })
                                            await i_plugins.deferUpdate()
                                            break;
                                    }
                                })
                                break;
                            case "continue":
                                selected_plugins = { MinifiyAll: false, Virtualize: false, CustomPlugins: {} }
                                embed_main.data.fields[1].value = inlineCode("Default")
                                embed_main.setColor(Colors.Green).setDescription(`${GetEmoji("yes")} Script session created!`)
                                select.setOptions(_plugins).addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Back')
                                        .setValue('back')
                                        .setEmoji("<:update:1129139085362090145>")
                                )
                                row_buttons.components.forEach((c: ButtonBuilder) => {
                                    c.setDisabled(false)
                                    if (c.data.label === " ") c.setEmoji("<:update:1129139085362090145>").setLabel("Obfuscate")
                                })
                                response.edit({ components: [row_buttons], files: [], embeds: [embed_main] })
                                await i.deferUpdate()
                                break;
                            default:
                                i.deferUpdate()
                                self.utils.SendErrorMessage("error", cmd, `Invalid interaction id '${i.customId}'`)
                                break;
                        }
                    })
                })
            }).catch(err => {
                _isObfuscating[cmd.message.author.id] = false
                console.error(err)
            })
        } catch (error) {
            console.error(error)
            _isObfuscating[cmd.message.author.id] = false
        }
        return true
    }
}

module.exports = Command