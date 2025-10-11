export type ServiceStatus = {
    ok: boolean,
    ping: number,
    statusText: string,
    statusCode: number,
}

export type ServiceOutage = {
    time: number,
    services: { [name: string]: ServiceStatus },
    identifier: string,
    oid: string,
    count?: number,
}

export type ServerStatistics = {
    start_time: string,
    memory_usage: number,
    queue_waiting: number,
    queue_active: number,
    queue_web_active: number,
    queue_total: number,
    total_file: number,
    total_obfuscations: number,
}