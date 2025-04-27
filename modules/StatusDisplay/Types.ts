export interface PingResponses {
    homepage?: PingResponse,
    forum?: PingResponse,
    api?: PingResponse,
    server?: ServerStatsResponse
}

export interface PingResponse {
    name?: string,
    ping?: number | string,
    status?: number | string,
    statusText?: string,
    server_stats?: ServerStats
}

export interface ServerStatsResponse {
    name?: string,
    ping: number | string,
    status?: number | string,
    statusText?: string,
    server_stats: ServerStats
}

export interface ServerStats {
    start_time?: string
    memory_usage?: number
    queue_waiting?: number
    queue_active?: number
    queue_total?: number
    total_file?: number
    total_obfuscations?: number
}

export interface Outage {
    state?: boolean,
    time?: string | number,
    status?: string,
    affected_services: Array<any>
}

export interface OutageLog {
    outages: Outage[]
}