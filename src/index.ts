import { logger } from "./infrastructure/logger/logger";
import express from "express";
import bodyParser from "body-parser";
import requestLogger from "./infrastructure/logger/request-logger.middleware";
import errorHandler from "./infrastructure/error/error-handler.middleware";
import { setupSwaggerRoutes } from "./infrastructure/openapi/openapiRoutes";
import { RegisterRoutes } from "./route/routes";
import { appConfig } from "./infrastructure/app.config";
import cors from "./infrastructure/cors/cors.provider";
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { routeRateLimit, userRateLimit } from "./infrastructure/rate-limiter/rate-limiter.middleware";
import { validateChatGptConfig } from "./external/chatgpt/chatgpt.config";
import * as http from "node:http";
import { MqManager } from "./infrastructure/mq/mq-manager";

const mqManager = new MqManager();
let server: http.Server | null = null;

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

const app = express();

mqManager.run();
startServer().catch((error) => {
  logger.fatal({ error }, "Failed to start the server");
  process.exit(1);
});

async function startServer() {
  if (appConfig.NODE_ENV === "production") await validateConfig();

  app.enable("trust proxy");

  Sentry.init({
    dsn: appConfig.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 0.05,
    profilesSampleRate: 0.05,
    enabled: appConfig.NODE_ENV === "production",
    environment: appConfig.NODE_ENV,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  app.use(requestLogger);
  app.use(cors);

  app.use(bodyParser.json());

  app.use(routeRateLimit({ limit: 160, interval: 60 }));
  app.use(userRateLimit({ limit: 200, interval: 60 }));

  RegisterRoutes(app);

  app.use(Sentry.Handlers.errorHandler());
  app.use(errorHandler);

  setupSwaggerRoutes(app);

  server = app.listen(appConfig.BACKEND_PORT, () => {
    logger.info(`Server is running on port ${appConfig.BACKEND_PORT}`);
  });
}

async function validateConfig() {
  try {
    await validateChatGptConfig();
  } catch (e: any) {
    throw new Error("ChatGPT config is invalid", { cause: e });
  }
}

async function shutdown() {
  logger.info("Shutting down gracefully");

  await mqManager.close();

  server?.close(() => {
    logger.info("Server shut down");
  });
}
