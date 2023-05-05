const fetch = require("node-fetch")
const { API_URL } = require("../.config")
const { sendErrorMessage } = require("../utils/command")
const { createEmbed } = require("../utils/embed")
const { AttachmentBuilder, Message } = require("discord.js")

module.exports = {
    /**
     * @description Checks if a string contains a discord webhook
     * @param { String } string 
     */
    hasWebhook: function (string) { return /https:\/\/.+\/api\/webhooks\/[0-9]+\/.*\w/.test(string) },
    /**
     * @description Checks if a string contains a discord codeblock
     * @param { String } string 
     */
    hasCodeblock: function (string) { return /^([`])[`]*\1$|^[`]/mg.test(string) },
    /**
     * Parses all discord webhooks in a string
     * @param { String } string 
     */
    parseWebhooks: function (string) { return string.match(/.*https:\/\/.+\/api\/webhooks\/[0-9]+\/.*/gm) },
    /**
     * @description Parses a discord codeblock. (Removes all codeblock related characters)
     * @param { String } string 
     */
    parseCodeblock: function (string) { return string.replace(/(^`\S*)|`+.*/mg, "").trim() },
    /**
     * @description Creates a luaobfuscator.com session with the given script
     * @param { String } script 
     */
    createSession: async function (script) {
        if (!script || typeof script != "string") return { error: "Unable to create session. (invalid script)", error_name: "createSession" }
        const response = await fetch(`${API_URL}newscript`, { method: "POST", body: script })
        return response.json()
    },
    /**
     * Obfuscates the given session and config
     * @param { String } session 
     * @param { { String: Object | boolean | String } } config 
     * @param { Message } message discord message for error handling  
     */
    manualObfuscateScript: async function (session, config = {}, message) {
        if (!session || typeof session != "string") return { error: "Unable to obfuscatescript. (invalid session)", error_name: "manualObfuscateScript" }
        const response = await fetch(`${API_URL}obfuscate`, { method: "POST", body: JSON.stringify(config), headers: { sessionId: session, apiKey: process.env.API_KEY } }).catch(error => {
            if (message) sendErrorMessage(error, message)
            throw error
        })
        return response.json()
    },
    /**
     * Obfuscates a script
     * @param { String } script 
     * @param { Message } message discord message for error handling  
     */
    obfuscateScript: async function (script, message) {
        if (!script || typeof script != "string") return { error: "Unable to obfuscatescript. (invalid script)", error_name: "obfuscateScript" }
        const response = await fetch(`${API_URL}one-click/hard`, { method: "POST", body: script, headers: { apiKey: process.env.API_KEY } }).catch(error => {
            if (message) sendErrorMessage(error, message)
            throw error
        })
        return response.json()
    },
    /**
     * Creates a discord file attachment with the given buffer content
     * @param { Buffer } content 
     */
    createFileAttachment: function (content) {
        if (!content || !Buffer.isBuffer(content)) return { error: "Unable to create file attachment. (invalid buffer)", error_name: "obfuscateScript" }
        const attachment = new AttachmentBuilder(content, { name: "obfuscated.lua" })
        return attachment
    }
}