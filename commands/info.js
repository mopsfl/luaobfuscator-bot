const { createEmbed } = require("../utils/embed.js")
const { Colors, hyperlink, inlineCode, quote } = require("discord.js")
const { formatUptime } = require("../utils/misc.js")
const { ICON_URL, SUPPORT_URL } = require("../.config.js")

module.exports = {
    enabled: true,

    category: "BOT",
    command: "info",

    arguments: "",

    allow_dm: true,
    ignore_arguments: true, //wont throw any syntax error even if the arguments are wrong

    callback: async function (arg) {
        const client = global.client,
            message = arg.message || arg

        if (!message) return

        let embed = createEmbed({
            title: `LuaObfuscator Bot`,
            description: `Discord Bot made for ${hyperlink("LuaObfuscator", "https://luaobfuscator.com")} to quickly obfuscate lua scripts via discord.`,
            fields: [
                { name: "• Uptime", value: inlineCode(formatUptime(client?.uptime)), inline: true },
                { name: "• Support Server", value: `${SUPPORT_URL}`, inline: true },
            ],
            color: Colors.Green,
            footer: {
                text: "LuaObfuscator Bot • made by mopsfl#4588",
                iconURL: ICON_URL
            },
            thumbnail: ICON_URL
        })

        await message.reply({ embeds: [embed] })
    }
}