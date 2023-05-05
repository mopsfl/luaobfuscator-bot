const prefix = "!" // Main prefix for commands

module.exports = {
    prefix: prefix,
    activity_update_interval: 10000, // Update interval for the bot activity. 1000(ms) = 1 second
    dm_commands: true, // If dm commands should be allowed 

    script_scan_options: {
        discord_webhooks: "warn" // block, warn, null
    },

    SESSION_URL: "https://luaobfuscator.com/?session=",
    API_URL: "https://luaobfuscator.com/api/obfuscator/",
    ICON_URL: "https://luaobfuscator.com/img/logo.png",

    activities: [ // Bot activities
        `${prefix}obf <code | file>`,
        `${prefix}obfuscate <code | file>`,
    ],
    command_list: { // Commands list for the help command
        "• OBFUSCATION": [
            "obfuscate"
        ],
        "• BOT": [
            "help",
            "ping",
        ],
    },
    ignored_guilds: [
        "",
    ]
}