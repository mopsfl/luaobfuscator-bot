import dotenv from "dotenv"
dotenv.config()

export default {
    prefix: "!",

    activity_update_interval: 10000, // Update interval for the bot activity. 1000(ms): 1 second
    status_update_interval: 60000, // Update interval for the status displays. 1000(ms): 1 second
    dm_commands: true, // If dm commands should be allowed

    support_url: "https://discord.com/invite/Y556HXUByG",
    session_url: "https://luaobfuscator.com/?session=",
    api_url: "https://luaobfuscator.com/api/obfuscator/",
    icon_url: "https://mopsfl.de/images/projects/luaobf.png",

    repo_commits_url: "https://api.github.com/repos/mopsfl/luaobfuscator-bot/commits?page=1&per_page=1",

    allowed_guild_ids: ["1112349916744917054", "1129884318634877032"],

    prod: {
        SERVER_ID: "1112349916744917054",
        STATUS_CHANNEL_ID: "1128995128745402468",
        ALERT_CHANNEL: "1112384996259414110"
    },

    dev: {
        SERVER_ID: "1129884318634877032",
        STATUS_CHANNEL_ID: "1129885114038489188",
        ALERT_CHANNEL: "1129884319645712497"
    },

    STATUS_DISPLAY: {
        status_update_interval: 60_000,
        ids_to_alert: ["792875215243575306", "1111257318961709117"],
        endpoints: {
            homepage: "https://luaobfuscator.com",
            forum: "https://luaobfuscator.com/forum",
            api: "https://api.luaobfuscator.com/v1/obfuscator/newscript",
        },
        stats_url: "https://luaobfuscator.com/forum/stats",
    }
}