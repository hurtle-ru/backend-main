export interface RateLimitConfig {
    limit: number;
    interval: number;
}

export interface RateInfo {
    count: number;
    lastReset: number;
}
