import IORedis from "ioredis";
import { redisConfig } from "./redis.config";


const redis = new IORedis(redisConfig.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return 5000;
  },
});

export default redis;