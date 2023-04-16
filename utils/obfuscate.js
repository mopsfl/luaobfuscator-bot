const fetch = require("fetch")
const axios = require('axios');
const { createEmbed } = require("../utils/embed")
const { Colors } = require("discord.js")

module.exports = {
    /**
     * @description Obfuscates given lua script with the luaobfuscator api
     * @param { String } script
     */
    obfuscate: async function(script, message) {
        if (!script || !message) return

        //create session
        await axios({
            method: "post",
            url: `https://luaobfuscator.com/api/obfuscator/newscript`,
            data: script
        }).then(async(res) => {
            console.log(res.data.sessionId)
            if (!res.data.sessionId) {
                let error_embed = createEmbed({
                    title: `${getEmoji("error")} Error`,
                    description: "```Unable to get sessionId.```",
                    color: Colors.Red,
                    timestamp: true
                })
                return message.reply({ embeds: [error_embed] })
            }
            //obfuscate (not done bc /obfuscate doesnt work or im using it wrong)
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
            })
        }).catch(e => {
            console.error(e)
        })
    }
}