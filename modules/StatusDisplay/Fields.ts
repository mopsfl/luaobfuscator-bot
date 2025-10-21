import { APIEmbedField } from "discord.js";

export default {
    Indexes: {
        Main: {
            LastUpdated: 0,
            LastOutage: 2,

            Services: {
                homepage: 4,
                forum: 5,
                api: 6
            },

            Statistics: {
                serverUptime: 8,
                memoryUsage: 9,
                botUptime: 10,
            }
        },
        Stats: {
            totalObfuscations: 0,
            recentObfuscations: 2
        },
        Alert: {
            Services: {
                homepage: 1,
                forum: 2,
                api: 3
            },

            Other: {
                outageStartTime: 5,
                outageEndTime: 6,
                outageDuration: 7,
                outageId: 8,
                fingerprint: 9,
            }
        },
        OutageHistory: {
            services: 0,
            status: 1,
            time: 2,
            website: 3
        }
    },

    SetValue(fields: APIEmbedField[], index: number, value: string, notSmall = false) {
        if (!fields[index]) return
        fields[index].value = `${notSmall ? "" : "-# "}${value}`
    }
}