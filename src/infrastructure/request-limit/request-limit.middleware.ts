import { Request, Response, NextFunction } from 'express';
import { JwtModel, } from "../../domain/auth/auth.dto";
import { HttpError } from "../../infrastructure/error/http.error";
import { RateInfo, RateLimitConfig } from "./request-limit.dto"
import { max } from 'lodash';


const MILLISECONDS_IN_SECOND = 1000

const USERS_RATE_MAP = new Map<string, RateInfo>();
const IPS_RATE_MAP = new Map<string, RateInfo>();


function getHeaderFirstValue(header: string, req: Request): string | undefined {
    let value = req.headers[header];
    value = Array.isArray(value) ? value[0] : value;
    return value;
}

function getIp(req: Request): string | undefined {
    return getHeaderFirstValue('x-real-ip', req) || req.ip;
}


function updateRate(identifier: string, rateMap: Map<string, RateInfo>, config: RateLimitConfig): RateInfo {
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
export function userRateLimit(config: RateLimitConfig) {
    config.interval *= MILLISECONDS_IN_SECOND;

    return function(req: Request, res: Response, next: NextFunction) {
        const ip = getIp(req);
        console.log("IP:", ip)
        const token = getHeaderFirstValue('Authorization', req);

        const userRate = token ? updateRate(token, USERS_RATE_MAP, config).count : 0;
        const ipRate = ip ? updateRate(ip, IPS_RATE_MAP, config).count : 0;

        if (userRate > config.limit || ipRate > config.limit) {
            throw new HttpError(429, 'Too Many Requests')
        }

        next();
    }
}


/**
* Set the maximum number of requests for each user and ip per route per interval.
* @param {number} config.limit Max count of requests per interval
* @param {number} config.interval Interval in seconds
*/
export function routeRateLimit(config: RateLimitConfig) {
    const usersRateMap = new Map<string, RateInfo>();
    const ipsRateMap = new Map<string, RateInfo>();

    config.interval *= MILLISECONDS_IN_SECOND;

    return function(req: Request, res: Response, next: NextFunction) {
        const ip = getIp(req);
        const token = getHeaderFirstValue('Authorization', req);

        const userRate = token ? updateRate(token, usersRateMap, config).count : 0;
        const ipRate = ip ? updateRate(ip, ipsRateMap, config).count : 0;

        if (userRate > config.limit || ipRate > config.limit) {
            throw new HttpError(429, 'Too Many Requests')
        }

        next();
    }
}
