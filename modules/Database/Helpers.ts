export type DBError = {
    code: string;
    message: string;
    sqlMessage?: string;
    status: number;
};

export type DBResponse<T> = {
    success: boolean;
    data?: T;
    error?: DBError;
};

export const ok = <T>(data: T): DBResponse<T> => ({ success: true, data });
export const fail = (code: string, message: string, sqlMessage: string, status = 500): DBResponse<any> => ({
    success: false,
    error: { code, message, sqlMessage, status },
});

export const parseSearchQuery = (query?: Record<string, any>): [string?, any?] => {
    if (!query || typeof query !== "object") return [undefined, undefined];
    const [key, value] = Object.entries(query)[0] ?? [];
    return [key as string, value];
};

export const buildSetClause = (updates: Record<string, any>): string =>
    Object.keys(updates).map(col => `\`${col}\` = ?`).join(", ");

export const buildWhereClause = (query?: Record<string, any>) => {
    const [col, val] = parseSearchQuery(query);
    return col ? { clause: `\`${col}\` = ?`, value: val } : { clause: "", value: undefined };
};
