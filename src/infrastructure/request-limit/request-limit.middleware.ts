import { Response, NextFunction } from 'express';
import { JwtModel, } from "../../domain/auth/auth.dto";
import { HttpError } from "../../infrastructure/error/http.error";


interface RateLimitConfig {
    limit: number;
    interval: number;
}


/**
* Set max count of user request for route per interval.
* @param {string} config.limit Max count of requests per interval
* @param {number} config.interval Interval in milliseconds
*/
export default function(config: RateLimitConfig) {
    const requestLimitMap = new Map<string, { count: number, lastReset: number }>();

    return function(req: JwtModel, res: Response, next: NextFunction) {
        const userId = req.user.id;
        const currentTime = Date.now();

        if (!requestLimitMap.has(userId)) requestLimitMap.set(userId, { count: 1, lastReset: currentTime })
        else {
            const userRequestInfo = requestLimitMap.get(userId)!;

            if (currentTime - userRequestInfo.lastReset > config.interval) {
                userRequestInfo.count = 1;
                userRequestInfo.lastReset = currentTime;
            } else {
                if (userRequestInfo.count >= config.limit) {
                    throw new HttpError(429, 'T  @Response<HttpErrorBody & { "error": "User does not have access to this MeetingSlot type" }>(403)
')}
                userRequestInfo.count++;
            }
        }
        next();
    }
}
