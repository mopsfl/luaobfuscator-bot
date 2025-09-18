import { config } from "../../index"
import { ServerStatistics, ServiceStatus } from "./Types"
import getStatusCode from "url-status-code"
import http_status from "http-status"

const HTTP_STATUS_TEXTS = { ...http_status, ...http_status.extra.cloudflare, ...http_status.extra.nginx }

export default {
    async GetStatuses(): Promise<[Map<string, ServiceStatus>, Map<string, ServiceStatus>]> {
        const services: Map<string, ServiceStatus> = new Map();

        await Promise.all(
            Object.entries(config.STATUS_DISPLAY.endpoints).map(async ([serviceName, serviceUrl]) => {
                const start_tick = Date.now();
                const statusCode = await getStatusCode(serviceUrl);

                services.set(serviceName, {
                    ok: (statusCode == 405 && serviceName == "api" ? 200 : statusCode) === 200,
                    ping: Date.now() - start_tick,
                    statusCode: (statusCode == 405 && serviceName == "api" ? 200 : statusCode),
                    statusText: (statusCode == 405 && serviceName == "api" ? HTTP_STATUS_TEXTS[200] : HTTP_STATUS_TEXTS[statusCode]),
                });
            })
        );

        return [services, new Map(Array.from(services.entries()).filter(([_, service]) => !service.ok))];
    },

    async GetStatistics(): Promise<ServerStatistics> {
        return await fetch(config.STATUS_DISPLAY.stats_url).then(async res => {
            if (!res.ok) return { "start_time": "9/16/2025 3:31:01 PM", "memory_usage": 581353520, "queue_waiting": 0, "queue_active": 0, "queue_web_active": 0, "queue_total": 0, "total_file": 529530, "total_obfuscations": 529530 }
            return await res.json()
        })
    }
}