import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";


const cache = new NodeCache();

// Higher-order function to generate middleware with custom cache time
export function publicCacheMiddleware(ttl: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const cacheKey = `__express__${req.originalUrl || req.url}`;
    const cachedContent = cache.get(cacheKey);

    // Set Cache-Control header for browser caching
    // max-age directive specifies the maximum amount of time (in seconds) a resource will be considered fresh
    res.setHeader("Cache-Control", `public, max-age=${ttl}`);

    if (cachedContent) {
      console.log(`Serving from cache: ${cacheKey}`);
      res.send(cachedContent);
      return;
    }

    // Store the original res.send function
    const originalSend = res.send.bind(res);

    // Override res.send to capture and cache the response
    res.send = function(body: any): Response {
      cache.set(cacheKey, body, ttl);
      return originalSend(body); // Make sure to return the result of originalSend
    };

    next();
  };
}
