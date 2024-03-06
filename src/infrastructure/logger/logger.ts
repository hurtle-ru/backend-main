import pino from "pino";
import pinoHttp from "pino-http";
import fs from "fs";


const logsDir = "./logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = pino({
  level: "trace",
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    targets: [
      {
        level: "trace",
        target: "pino/file",
        options: { destination: `${logsDir}/.log` },
      },
      {
        level: "trace",
        target: "pino-pretty",
        options: {
          translateTime: "dd-mm-yyyy HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    ],
  },
});

const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => ({
      url: req.url,
      method: req.method,
      query: req.query,
      params: req.params,
      headers: req.headers,
      ip: req.headers["X-Forwarded-For"] || req.remoteAddress,
    }),
  },
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) return "warn";
    else if (res.statusCode >= 500 || err) return "error";

    return "info";
  },
  customErrorObject(req, res, error, loggableObject) {
    return { res };
  },
  quietReqLogger: true,
});

export { logger, httpLogger };
