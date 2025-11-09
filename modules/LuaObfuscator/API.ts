import config from "../../config";
import { ObfuscationResult } from "./Types"
import http_status from "http-status"

const HTTP_STATUS_TEXTS = { ...http_status, ...http_status.extra.cloudflare, ...http_status.extra.nginx }

export default {
    v1: {
        CreateSession: async function (script: string): Promise<ObfuscationResult> {
            try {
                const response = await fetch(`${config.api_url}newscript`, { method: "POST", body: script, headers: { apiKey: process.env.LUAOBF_APIKEY } })
                return response.ok && response.json()
            } catch (error) {
                console.error(error)
            }
        },

        Obfuscate: async function (script?: string, session?: string, obfconfig?: any): Promise<ObfuscationResult> {
            let response = null
            if (typeof obfconfig === "object") {
                response = await fetch(`https://api.luaobfuscator.com/v1/obfuscator/obfuscate`, {
                    method: "POST",
                    body: JSON.stringify(obfconfig),
                    headers: {
                        "Content-Type": "application/json",
                        apiKey: process.env.LUAOBF_APIKEY,
                        sessionId: session
                    }
                }).catch(error => {
                    throw error
                })
            } else {
                response = await fetch(`${config.api_url}one-click/hard`, { method: "POST", body: script, headers: { apiKey: process.env.LUAOBF_APIKEY } }).catch(error => {
                    throw error
                })
            }

            return await response.json().catch()
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

                return response.ok ? await response.json() : { status: "FAILED", message: `${response.statusText !== "<none>" ? response.statusText : HTTP_STATUS_TEXTS[response.status]} (${response.status})` }
            } catch (error) {
                console.error(error)
                return error
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