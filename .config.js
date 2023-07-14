require("dotenv").config()

const prefix = "!" // Main prefix for commands

module.exports = {
    prefix: prefix,
    activity_update_interval: 10000, // Update interval for the bot activity. 1000(ms) = 1 second
    status_update_interval: 60000, // Update interval for the status displays. 1000(ms) = 1 second
    dm_commands: true, // If dm commands should be allowed 

    script_scan_options: {
        discord_webhooks: "warn" // block, warn, null
    },

    SUPPORT_URL: "https://discord.com/invite/Y556HXUByG",
    SESSION_URL: "https://luaobfuscator.com/?session=",
    ICON_URL: "https://luaobfuscator.com/img/logo.png",
    SERVER_STATS_URL: process.env.STATS_ENDPOINT,

    STATUS_ENDPOINTS: JSON.parse(process.env.STATUS_ENDPOINTS) || {},

    SERVER_ID: "1112349916744917054",
    STATUS_EMBED_ID: "1128997522917040169",

    SERVER_STATS: {
        MAX_RAM: 3.85e+9
    },

    activities: [ // Bot activities
        `${prefix}obf <code | file>`,
        `${prefix}obfuscate <code | file>`,
    ],
    command_list: { // Commands list for the help command
        "• LUA OBFUSCATOR": [
            "status"
        ],
        "• BOT": [
            "help",
            "ping",
            "info"
        ],
    },
    ignored_guilds: [
        "",
    ]
}