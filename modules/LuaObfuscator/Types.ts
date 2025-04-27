export interface ObfuscationResult {
    message?: string,
    code?: string,
    sessionId?: string,
    status?: "FINISHED" | "INITIATED" | "FAILED"
}