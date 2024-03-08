import { ActionRowBuilder, AttachmentBuilder, bold, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, Colors, ComponentType, inlineCode, quote, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import * as self from "../index"
import { cmdStructure } from "../modules/Command";
import GetEmoji from "../modules/GetEmoji";

const _options = [
    { label: "MinifiyAll", description: `This results in all code on a single line, no comments..`, value: "MinifiyAll" },
    { label: "Virtualize", description: `Makes the final code virtualized.`, value: "Virtualize" },
    { label: "EncryptStrings", description: `Encrypts strings into something like local foo = v8('\\x42..')`, value: "EncryptStrings" },
    { label: "MutateAllLiterals", description: `Mutates all numeric literals into basic +/- binary nodes.`, value: "MutateAllLiterals" },
    { label: "MixedBooleanArithmetic", description: `Mutates literals into mixed boolean arithmerics.`, value: "MixedBooleanArithmetic" },
    { label: "JunkifyAllIfStatements", description: `Injects opaque conditions into the if statement.`, value: "JunkifyAllIfStatements" },
    { label: "JunkifyBlockToIf", description: `Turns do/end blocks into opaque if statements.`, value: "JunkifyBlockToIf" },
    { label: "ControlFlowFlattenAllBlocks", description: `Injects basic while loops with a state counter.`, value: "ControlFlowFlattenV1AllBlocks" },
    { label: "EncryptFuncDeclaration", description: `Turns the declaration of a (global) function into an encrypted string.`, value: "EncryptFuncDeclaration" },
    { label: "SwizzleLookups", description: `Swizzle lookups, will turn foo.bar into foo['bar'].`, value: "SwizzleLookups" },
]

const _isObfuscating = []

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
            .setCustomId("select_options")
            .setPlaceholder("Select an option")
            .setOptions(_options)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Back')
                    .setValue('back')
                    .setEmoji("<:update:1129139085362090145>")
            ),
            obfuscate = new ButtonBuilder()
                .setLabel("Obfuscate")
                .setCustomId("obfuscate")
                .setStyle(ButtonStyle.Success),
            options = new ButtonBuilder()
                .setLabel("Customize Options")
                .setCustomId("options")
                .setStyle(ButtonStyle.Primary),
            cancel = new ButtonBuilder()
                .setLabel("Cancel")
                .setCustomId("cancel")
                .setStyle(ButtonStyle.Danger)

        const embed_main = self.Embed({
            color: Colors.Green,
            timestamp: true,
            title: "Custom Obfuscation",
            description: `${GetEmoji("yes")} Script session created!`,
            fields: [
                { name: "Script Session:", value: inlineCode("N/A"), inline: false },
                { name: "Selected Options:", value: inlineCode("N/A"), inline: false },
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

        let selected_options = { MinifiyAll: false, Virtualize: false, CustomPlugins: {} },
            option_presets = {
                "EncryptStrings": [100],
                "MutateAllLiterals": [100],
                "MixedBooleanArithmetic": [100],
                "JunkifyAllIfStatements": [100],
                "JunkifyBlockToIf": [100],
                "ControlFlowFlattenV1AllBlocks": [100],
                "EncryptFuncDeclaration": true,
                "SwizzleLookups": [100],
                "Virtualize": true,
                "MinifiyAll": true,
            }

        try {
            let row_buttons: any = new ActionRowBuilder().addComponents(obfuscate, options, cancel),
                row_options: any = new ActionRowBuilder().addComponents(select),
                response = await cmd.message.reply({ embeds: [embed_loading] }),
                collector_mainButtons = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3_600_00 })
            await self.utils.createSession(script_content).then(async _response => {
                console.log(`created new script session ${_response.sessionId}`);

                embed_main.data.fields[0].value = inlineCode(_response.sessionId)
                response.edit({ components: [row_buttons], embeds: [embed_main] })
                collector_mainButtons.on("collect", async i => {
                    if (i.user.id !== cmd.message.author.id) {
                        i.deferUpdate()
                        return;
                    }
                    switch (i.customId) {
                        case "obfuscate":
                            row_buttons.components.forEach((c: ButtonBuilder) => {
                                c.setDisabled(true)
                                if (c.data.label === "Obfuscate") c.setEmoji("<:loading:1135544416933785651>").setLabel(" ")
                            })
                            embed_main.setColor(Colors.Yellow).setDescription(`${GetEmoji("yes")} Script session created!\n${GetEmoji("loading")} Obfuscating script... Please wait...`)
                            await response.edit({ components: [row_buttons], embeds: [embed_main] })
                            await self.utils.manualObfuscateScript(_response.sessionId, selected_options).then(async res => {
                                if (!res?.code) {
                                    embed_main.setColor(Colors.Red).setDescription(`${GetEmoji("yes")} Script session created!\n${GetEmoji("no")} Error while obfuscating script!`)
                                    self.utils.SendErrorMessage("error", cmd, res?.message, "Obfuscation Error")
                                    response.edit({ embeds: [embed_main], components: [] })
                                    _isObfuscating[cmd.message.author.id] = false
                                    return
                                }
                                file_attachment = self.utils.createFileAttachment(Buffer.from(res?.code), `${_response.sessionId}.lua`)
                                await response.edit({
                                    files: [file_attachment],
                                    components: [],
                                    embeds: []
                                })
                                _isObfuscating[cmd.message.author.id] = false
                            })
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
                            var response_options = await response.edit({ components: [row_options] }),
                                collector_options = response_options.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_00 })

                            collector_options.on("collect", async i_options => {
                                if (i_options.user.id !== cmd.message.author.id) {
                                    i_options.deferUpdate()
                                    return;
                                }
                                const selection = i_options.values[0]
                                switch (selection) {
                                    case "back":
                                        response.edit({ components: [row_buttons] })
                                        await i_options.deferUpdate()
                                        collector_options.stop()
                                        break;
                                    default:
                                        const optionIndex = select.options.findIndex(o => o.data.value === selection)
                                        select.spliceOptions(optionIndex, 1)
                                        console.log(`remove option index ${optionIndex} from list`);

                                        row_options = new ActionRowBuilder().addComponents(select)

                                        if (embed_main.data.fields[1].value === "`N/A`") embed_main.data.fields[1].value = ""
                                        embed_main.data.fields[1].value = embed_main.data.fields[1].value + `\n> ${inlineCode(selection)}`
                                        if (selected_options[selection] !== undefined) {
                                            selected_options[selection] = option_presets[selection]
                                            console.log(selected_options);
                                        } else {
                                            selected_options.CustomPlugins[selection] = option_presets[selection]
                                            console.log(selected_options);
                                        }

                                        response.edit({ embeds: [embed_main], components: [row_options] })
                                        await i_options.deferUpdate()
                                        break;
                                }
                            })
                            break;
                        default:
                            break;
                    }
                })
            })
        } catch (error) {
            console.error(error)
            _isObfuscating[cmd.message.author.id] = false
        }
        return true
    }
}

module.exports = Command