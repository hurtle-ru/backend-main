export interface RateLimiterConfig {
    limit: number;
    interval: number;
}

export interface RateInfo {
    count: number;
    lastReset: number;
}
