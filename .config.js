let prefix = "!"

module.exports = {
    prefix: prefix, // Prefix for commands
    activity_update_interval: 10000, // Update interval for the bot activity
    dm_commands: true, // If dm commands should be allowed 
    activities: [ // Bot activities
        `${prefix}obf <code | file>`,
        `${prefix}obfuscate <code | file>`,
    ],
    command_list: { // Commands list for the help command
        "BOT": [
            "help",
            "ping",
        ],
        "OBFUSCATION": [
            "obfuscate"
        ]
    },
    ignored_guilds: [
        "",
    ]
}