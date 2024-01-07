import express from "express";
import bodyParser from "body-parser";
import requestLogger from "./infrastructure/logger/requestLogger";
import errorHandler from "./infrastructure/error/errorHandler";
import { setupSwaggerRoutes } from "./infrastructure/openapi/openapiRoutes";
import { RegisterRoutes } from "./route/routes";
import { appConfig } from "./infrastructure/app.config";
import cors from "./infrastructure/cors/cors";
// import * as Sentry from "@sentry/node";
// import { ProfilingIntegration } from "@sentry/profiling-node";


const app = express();

// Sentry.init({
//   dsn: appConfig.SENTRY_DSN,
//   integrations: [
//     // enable HTTP calls tracing
//     new Sentry.Integrations.Http({ tracing: true }),
//     // enable Express.js middleware tracing
//     new Sentry.Integrations.Express({ app }),
//     new ProfilingIntegration(),
//   ],
//   // Performance Monitoring
//   tracesSampleRate: 1.0, //  Capture 100% of the transactions
//   // Set sampling rate for profiling - this is relative to tracesSampleRate
//   profilesSampleRate: 1.0,
//   enabled: appConfig.NODE_ENV === "production",
//   environment: appConfig.NODE_ENV,
// });

// The request handler must be the first middleware on the app
// app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
// app.use(Sentry.Handlers.tracingHandler());

app.use(requestLogger);
app.use(cors);
app.use(bodyParser.json());
RegisterRoutes(app);

// app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

setupSwaggerRoutes(app);


app.listen(appConfig.BACKEND_PORT, () => {
  console.log(`Server is running on port ${appConfig.BACKEND_PORT}`);
});
