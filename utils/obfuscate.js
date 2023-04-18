const axios = require('axios');
const { createEmbed } = require("../utils/embed")
const { Colors, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
const { getEmoji } = require("../utils/misc")
const { sendErrorMessage } = require("../utils/command")

module.exports = {
    /**
     * @description Obfuscates given lua script with the luaobfuscator api
     * @param { String } script
     */
    obfuscate: async function(script, message) {
        if (!script || !message) return
        const config = {
            "MinifiyAll": true,
            "MiniftAll": true,
            "Virtualize": false,
            "CustomPlugins": {
                "EncryptStrings": [100],
                "SwizzleLookups": [100],
                "MutateAllLiterals": [66],
                "ControlFlowFlattenV1AllBlocks": [50, 15, 15],
                "ControlFlowFlattenV1AllBlocks": [100],
                "JunkifyAllIfStatements": [50, 15, 10],
                "EncryptFuncDeclaration": [100],
                "DummyFunctionArgs": [6, 9],
            }
        }

        let obfuscating_embed = createEmbed({
            title: `Obfuscating, please wait...`,
            description: `${getEmoji("loading")} Creating session...`,
            color: Colors.Orange,
            timestamp: true
        })

        message.reply({ embeds: [obfuscating_embed] }).then(async(msg) => {
            //create session
            await axios({
                method: "POST",
                url: `https://luaobfuscator.com/api/obfuscator/newscript`,
                headers: { "apikey": "test" },
                data: script,
            }).then(async(newscript_res) => {
                if (!newscript_res.data.sessionId) {
                    let error_embed = createEmbed({
                        title: `${getEmoji("error")} Error`,
                        description: "```Unable to create session.```",
                        color: Colors.Red,
                        timestamp: true
                    })
                    return message.reply({ embeds: [error_embed] })
                }
                await axios({
                    method: "POST",
                    url: `https://luaobfuscator.com/api/obfuscator/obfuscate`,
                    headers: { "sessionId": newscript_res.data.sessionId, "apikey": "test" },
                    data: config
                }).then(async(obfuscate_res) => {
                    obfuscating_embed.data.description = `${getEmoji("check")} Session created! [[open]](https://luaobfuscator.com/?session=${newscript_res.data.sessionId})\n${getEmoji("loading")} Obfuscating script...`
                    await msg.edit({ embeds: [obfuscating_embed] })
                    if (obfuscate_res.data.code) {
                        let sessionid_str = "`" + `${newscript_res.data.sessionId}` + "`"
                        obfuscating_embed.data.description = `${getEmoji("check")} Session created! [[open]](https://luaobfuscator.com/?session=${newscript_res.data.sessionId})\n${getEmoji("check")} Script obfuscated!`
                        obfuscating_embed.addFields({
                            name: "Session ID",
                            value: sessionid_str
                        })
                        await msg.edit({ embeds: [obfuscating_embed] })
                        const attachment = new AttachmentBuilder(Buffer.from(obfuscate_res.data.code), { name: "obfuscated.lua" })
                            /*const download = new ButtonBuilder()
                                .setStyle(ButtonStyle.Primary)
                                .setLabel("Download")
                                .setCustomId("download")
                            const componentRow = new ActionRowBuilder()
                                .addComponents(download)*/
                        await message.reply({
                            files: [attachment],
                            //components: [componentRow]
                        })
                        await message.delete()
                        return obfuscate_res.data.code
                    } else {
                        let sessionid_str = "`" + `${newscript_res.data.sessionId}` + "`"
                        let error_str = "```" + `${obfuscate_res.data.message || "unknown error"}` + "```"
                        let error_embed = createEmbed({
                            title: `${getEmoji("error")} Error`,
                            description: "An error occurred while obfuscating your script!",
                            fields: [
                                { name: "Error", value: error_str },
                                { name: "Session ID", value: sessionid_str },
                            ],
                            color: Colors.Red,
                            timestamp: true
                        })
                        return msg.edit({ embeds: [error_embed] })
                    }
                }).catch(e => {
                    console.error(e)
                    sendErrorMessage(e, msg, "edit")
                })
            }).catch(e => {
                console.error(e)
                sendErrorMessage(e, msg, "edit")
            })
        })
    }
}