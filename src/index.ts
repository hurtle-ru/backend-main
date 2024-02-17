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
import { routeRateLimit, userRateLimit } from "./infrastructure/request-limit/request-limit.middleware"


const app = express();

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
app.enable("trust proxy");

app.use(routeRateLimit({limit: 80, interval: 60}));
app.use(userRateLimit({limit: 100, interval: 60}));

RegisterRoutes(app);

app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

setupSwaggerRoutes(app);


app.listen(appConfig.BACKEND_PORT, () => {
  console.log(`Server is running on port ${appConfig.BACKEND_PORT}`);
});
