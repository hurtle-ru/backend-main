import { Request, Response, NextFunction } from "express";
import { HttpError } from "../error/http.error";
import { RateInfo, RateLimiterConfig } from "./rate-limiter.dto"
import { getHeaderFirstValue, getIp } from '../../util'


const MILLISECONDS_IN_SECOND = 1000

const USERS_RATE_MAP = new Map<string, RateInfo>();
const IPS_RATE_MAP = new Map<string, RateInfo>();


function updateRate(identifier: string, rateMap: Map<string, RateInfo>, config: RateLimiterConfig): RateInfo {
    const currentTime = Date.now();

    if (!rateMap.has(identifier)) {
        const rate = { count: 1, lastReset: currentTime }

        rateMap.set(identifier, rate)

        return rate
    }

    const rate = rateMap.get(identifier)!;

    if (currentTime - rate.lastReset > config.interval) {
        rate.count = 1;
        rate.lastReset = currentTime;

    } else {
        rate.count++;
    }

    return rate
}


/**
* Set the global maximum number of requests for each user and ip per interval.
* Should be used only in app.use()
* @param {number} config.limit Max count of requests per interval
* @param {number} config.interval Interval in seconds
*/
export function userRateLimit(config: RateLimiterConfig) {
    config.interval *= MILLISECONDS_IN_SECOND;

    return function(req: Request, res: Response, next: NextFunction) {
        const ip = getIp(req);
        const token = getHeaderFirstValue("Authorization", req);

        const userRate = token ? updateRate(token, USERS_RATE_MAP, config).count : 0;
        const ipRate = ip ? updateRate(ip, IPS_RATE_MAP, config).count : 0;

        if ( Math.max(userRate, ipRate) > config.limit ) {
            throw new HttpError(429, "Too Many Requests")
        }

        next();
    }
}


/**
* Set the maximum number of requests for each user and ip per route per interval.
* @param {number} config.limit Max count of requests per interval
* @param {number} config.interval Interval in seconds
*/
export function routeRateLimit(config: RateLimiterConfig) {
    const usersRateMap = new Map<string, RateInfo>();
    const ipsRateMap = new Map<string, RateInfo>();

    config.interval *= MILLISECONDS_IN_SECOND;

    return function(req: Request, res: Response, next: NextFunction) {
        const ip = getIp(req);
        const token = getHeaderFirstValue("Authorization", req);

        const userRate = token ? updateRate(token, usersRateMap, config).count : 0;
        const ipRate = ip ? updateRate(ip, ipsRateMap, config).count : 0;

        if ( Math.max(userRate, ipRate) > config.limit ) {
            throw new HttpError(429, "Too Many Requests")
        }

        next();
    }
}
