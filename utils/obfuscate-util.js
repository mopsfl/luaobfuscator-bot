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
     * @description Parses a discord codeblock. (Removes all codeblock related characters)
     * @param { String } string 
     */
    parseCodeblock: function (string) { return string.replace(/(^`\S*)|`+.*/mg, "").trim() },
}