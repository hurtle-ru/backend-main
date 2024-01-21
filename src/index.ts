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


const app = express();

Sentry.init({
  dsn: appConfig.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 0.05,
  profilesSampleRate: 0.05,
  enabled: appConfig.NODE_ENV === "production",
  environment: appConfig.NODE_ENV,
});

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(requestLogger);
app.use(cors);
app.use(bodyParser.json());
RegisterRoutes(app);

app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

setupSwaggerRoutes(app);


app.listen(appConfig.BACKEND_PORT, () => {
  console.log(`Server is running on port ${appConfig.BACKEND_PORT}`);
});
