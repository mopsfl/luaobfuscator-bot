import { Message } from "discord.js"
import config from "../../config";
import { ObfuscationResult } from "./Types"

export default {
    v1: {
        CreateSession: async function (script: string) {
            try {
                const response = await fetch(`${config.api_url}newscript`, { method: "POST", body: script, headers: { apiKey: process.env.LUAOBF_APIKEY } })
                return response.ok && response.json()
            } catch (error) {
                console.error(error)
            }
        },

        Obfuscate: async function (script: string, message?: Message) {
            const response = await fetch(`${config.api_url}one-click/hard`, { method: "POST", body: script, headers: { apiKey: process.env.LUAOBF_APIKEY } }).catch(error => {
                if (message) this.SendErrorMessage(error, message)
                throw error
            })
            return await response.json().catch(async err => {
                console.error(err)
                return { message: `unexpected error occurred while obfuscating your script. (${response.statusText}_${response.status})` }
            })
        },
    },

    v2: {
        Obfuscate: async function (script: string, obfuscation_config: Object): Promise<ObfuscationResult> {
            try {
                let response = await fetch(`https://luaobfuscator.com/v2/obfuscator/obfuscate`, {
                    method: "POST",
                    body: JSON.stringify({ data: script, config: obfuscation_config }),
                    headers: {
                        "Content-Type": "application/json",
                        apiKey: process.env.LUAOBF_APIKEY
                    }
                }).catch(error => { throw error })

                return await response.json()
            } catch (error) {
                console.error(error)
            }
        },

        GetStatus: async function (sessionId: string): Promise<ObfuscationResult> {
            try {
                return await fetch(`https://luaobfuscator.com/v2/obfuscator/status`, {
                    method: "POST",
                    headers: {
                        sessionId: sessionId,
                        apiKey: process.env.LUAOBF_APIKEY
                    }
                }).then(res => res.json())
            } catch (error) {
                console.log(error)
                return
            }
        }
    }
}