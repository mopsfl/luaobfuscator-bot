import config from "../../config";
import { ServerStatistics, ServiceStatus } from "./Types"
import getStatusCode from "url-status-code"
import http_status from "http-status"

const HTTP_STATUS_TEXTS = { ...http_status, ...http_status.extra.cloudflare, ...http_status.extra.nginx }

export default {
    async GetStatuses(simulateFailedService = false, simulatedStatusCode?: any): Promise<[Map<string, ServiceStatus>, Map<string, ServiceStatus>]> {
        const services: Map<string, ServiceStatus> = new Map(),
            serviceEntries = Object.entries(config.STATUS_DISPLAY.endpoints)

        let failedServices: Set<string> = new Set()
        if (simulateFailedService) {
            failedServices = new Set(
                serviceEntries.map(([name]) => name)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, Math.floor(Math.random() * serviceEntries.length) + 1)
            )
        }

        await Promise.all(
            serviceEntries.map(async ([serviceName, serviceUrl]) => {
                const start_time = Date.now()

                let statusCode: number;
                if (simulateFailedService && failedServices.has(serviceName)) {
                    statusCode = parseInt(simulatedStatusCode) ?? 502
                } else {
                    statusCode = await getStatusCode(serviceUrl);
                }

                const effectiveStatusCode = (statusCode === 405 && serviceName === "api") ? 200 : statusCode

                services.set(serviceName, {
                    ok: effectiveStatusCode === 200,
                    ping: Date.now() - start_time,
                    statusCode: effectiveStatusCode,
                    statusText: HTTP_STATUS_TEXTS[effectiveStatusCode],
                });
            })
        );

        return [services, new Map(Array.from(services.entries()).filter(([_, service]) => !service.ok))]
    },

    async GetStatistics(): Promise<ServerStatistics> {
        return await fetch(config.STATUS_DISPLAY.stats_url).then(async res => {
            if (!res.ok) return { "start_time": "10/16/2025 8:40:00 PM", "memory_usage": 71729808, "queue_waiting": 0, "queue_active": 0, "queue_web_active": 0, "queue_total": 0, "total_file": 823048, "total_obfuscations": 823048 }
            //if (!res.ok) return { error: res.statusText }
            return await res.json()
        })
    }
}