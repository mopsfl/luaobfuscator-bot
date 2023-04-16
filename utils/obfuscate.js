const fetch = require("fetch")
const axios = require('axios');
const { createEmbed } = require("../utils/embed")
const { Colors, AttachmentBuilder } = require("discord.js")
const { getEmoji } = require("../utils/misc")


module.exports = {
    /**
     * @description Obfuscates given lua script with the luaobfuscator api
     * @param { String } script
     */
    obfuscate: async function(script, message) {
        if (!script || !message) return

        let obfuscating_embed = createEmbed({
            title: `Obfuscating, please wait...`,
            description: `${getEmoji("loading")} Creating session...`,
            color: Colors.Orange,
            timestamp: true
        })

        message.reply({ embeds: [obfuscating_embed] }).then(async(msg) => {
            //create session
            await axios({
                method: "post",
                url: `https://luaobfuscator.com/api/obfuscator/one-click/hard`,
                data: script
            }).then(async(res) => {
                if (!res.data.sessionId) {
                    let error_embed = createEmbed({
                        title: `${getEmoji("error")} Error`,
                        description: "```Unable to create session.```",
                        color: Colors.Red,
                        timestamp: true
                    })
                    return message.reply({ embeds: [error_embed] })
                }
                obfuscating_embed.data.description = `${getEmoji("check")} Session created!\n${getEmoji("loading")} Obfuscating script...`
                await msg.edit({ embeds: [obfuscating_embed] })
                let sessionid_str = "`" + `${res.data.sessionId}` + "`"
                obfuscating_embed.data.description = `${getEmoji("check")} Session created!\n${getEmoji("check")} Script obfuscated!`
                obfuscating_embed.addFields({
                    name: "Session ID",
                    value: sessionid_str
                })
                await msg.edit({ embeds: [obfuscating_embed] })
                const attachment = new AttachmentBuilder(Buffer.from(res.data.code), { name: "obfuscated.lua" })
                await message.reply({
                    content: "Obfuscated!",
                    files: [attachment],
                })
            }).catch(e => {
                console.error(e)
            })
        })
    }
}

/*obfuscate (not done bc /obfuscate doesnt work or im using it wrong)
await axios({
    method: "post",
    url: `https://luaobfuscator.com/api/obfuscator/obfuscate`,
    headers: { "sessionId": res.data.sessionId, "apiKey": "test" },
    data: {
        "MinifiyAll": true,
        "CustomPlugins": {
            "EncryptAllStrings": [100]
        }
    }
}).then((res) => {
    console.log(res)
}).catch(e => {
    console.error(e)
})*/