import * as self from "../index"

export default function (): string {
    if (!self.client) { self.Debug({ message: "Unable to count members.", error: "App not successfully initialized." }, true); return "N/A" }
    const guild = self.client.guilds.cache.get(self.config.SERVER_ID)
    if (!guild) return "N/A"
    return guild.memberCount?.toString() || "N/A"
}