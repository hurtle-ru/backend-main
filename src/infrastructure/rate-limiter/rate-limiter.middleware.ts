import { Request, Response, NextFunction } from "express";
import { HttpError } from "../error/http.error";
import { RateLimiterConfig } from "./rate-limiter.dto";
import { getIp } from "../controller/express-request/express-request.utils";
import redis from "../mq/redis.provider";
import { join } from "path";


const INITIAL_RATE = 0

const BASE_RATE_LIMIT_REDIS_RATE_KEY = "rate-limit"
const GLOBAL_RATE_KEY = "global"

const USERS_RATE_KEY = "users"
const IPS_RATE_KEY = "ips"

const ROUTES_RATE_KEY = "routes"

const GLOBAL_USERS_RATE_KEY = join(BASE_RATE_LIMIT_REDIS_RATE_KEY, GLOBAL_RATE_KEY, USERS_RATE_KEY);
const GLOBAL_IPS_RATE_KEY = join(BASE_RATE_LIMIT_REDIS_RATE_KEY, GLOBAL_RATE_KEY, IPS_RATE_KEY);


async function updateRate(identifier: string, rate: string, config: RateLimiterConfig): Promise<number> {
  identifier = join(rate, identifier)

  await redis.set(identifier, INITIAL_RATE.toString(), 'EX', config.interval, "NX");

  return await redis.incr(identifier)
}


/**
* Set the global maximum number of requests for each user and ip per interval.
* Should be used only in app.use()
* @param {number} config.limit Max count of requests per interval
* @param {number} config.interval Interval in seconds
*/
export function userRateLimit(config: RateLimiterConfig) {
  return async function(req: Request, res: Response, next: NextFunction) {
    const ip = getIp(req);
    const token = req.header("Authorization");

    const userRate = token ? await updateRate(token, GLOBAL_USERS_RATE_KEY, config) : 0;
    const ipRate = ip ? await updateRate(ip, GLOBAL_IPS_RATE_KEY, config) : 0;

    if (Math.max(userRate, ipRate) > config.limit) {
      return next(new HttpError(429, "Too Many Requests"));
    }

    next();
  };
}


/**
* Set the maximum number of requests for each user and ip per route per interval.
* @param {number} config.limit Max count of requests per interval
* @param {number} config.interval Interval in seconds
*/
export function routeRateLimit(config: RateLimiterConfig) {
  return async function(req: Request, res: Response, next: NextFunction) {
    const baseRateName = join(BASE_RATE_LIMIT_REDIS_RATE_KEY, ROUTES_RATE_KEY, req.baseUrl, req.path)

    const ip = getIp(req);
    const token = req.header("Authorization");

    const userRate = token ? await updateRate(token, join(baseRateName, USERS_RATE_KEY), config) : 0;
    const ipRate = ip ? await updateRate(ip, join(baseRateName, IPS_RATE_KEY), config) : 0;

    if (Math.max(userRate, ipRate) > config.limit) {
      return next(new HttpError(429, "Too Many Requests"));
    }

    next();
  };
}
