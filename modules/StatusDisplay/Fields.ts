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
        }
    },

    SetValue(fields: APIEmbedField[], index: number, value: string) {
        fields[index].value = `-# ${value}`
    }
}