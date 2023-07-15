import dotenv from "dotenv"
dotenv.config()

export default class Config {
    prefix = "!"

    activity_update_interval = 10000 // Update interval for the bot activity. 1000(ms) = 1 second
    status_update_interval = 5000 // Update interval for the status displays. 1000(ms) = 1 second
    dm_commands = true // If dm commands should be allowed 

    support_url = "https://discord.com/invite/Y556HXUByG"
    session_url = "https://luaobfuscator.com/?session="
    icon_url = "https://luaobfuscator.com/img/logo.png"

    SERVER_ID = "1129884318634877032"
    STATUS_DISPLAY = {
        STATUS_CHANNEL_ID: "1129885114038489188",
        status_update_interval: 5000,
        fetch_timeout: 10000,
        endpoints: {
            homepage: "https://luaobfuscator.com",
            forum: "https://luaobfuscator.com/forum",
            api: "https://luaobfuscator.com/api/obfuscator/newscript"
        }
    }

}