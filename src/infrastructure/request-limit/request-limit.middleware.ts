import { Response, NextFunction } from 'express';
import { JwtModel, } from "../../domain/auth/auth.dto";
import { HttpError } from "../../infrastructure/error/http.error";
import { RateInfo, RateLimitConfig } from "./request-limit.dto"


const MILLISECONDS_IN_SECOND = 1000


function getIp(req: any | JwtModel) {
    return req.headers['x-real-ip'] || req.connection.remoteAddress;
}

function checkAndUpdateRate(identifier: string, rateMap: Map<string, RateInfo>, config: RateLimitConfig) {
    const currentTime = Date.now();

    if (!rateMap.has(identifier)) rateMap.set(identifier, { count: 1, lastReset: currentTime })
    else {
        const requestRateInfo = rateMap.get(identifier)!;

        if (currentTime - requestRateInfo.lastReset > config.interval) {
            requestRateInfo.count = 1;
            requestRateInfo.lastReset = currentTime;
        } else {
            if (requestRateInfo.count >= config.limit) {
                throw new HttpError(429, 'Too many Requests')}
            requestRateInfo.count++;
        }
    }
}

/**
* Set max count of user request for route per interval.
* @param {number} config.limit Max count of requests per interval
* @param {number} config.interval Interval in seconds
*/
export default function rateLimit(config: RateLimitConfig) {
    const requestUsersRateMap = new Map<string, RateInfo>();
    const requestIpsRateMap = new Map<string, RateInfo>();

    config.interval *= MILLISECONDS_IN_SECOND;

    return function(req: any | JwtModel, res: Response, next: NextFunction) {
        const userId = req.user.id;
        const userIp = getIp(req);

        checkAndUpdateRate(userId, requestUsersRateMap, config);
        checkAndUpdateRate(userIp, requestIpsRateMap, config);

        next();
    }
}
