import pino from "pino";
import pinoHttp from "pino-http";
import fs from "fs";
import path from "path";


const logFilePath = initLogCounter();
const logger = pino({
  level: "trace",
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    targets: [
      {
        level: "trace",
        target: "pino-pretty",
        options: {
          translateTime: "dd-mm-yyyy HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
      {
        level: "trace",
        target: "pino/file",
        options: { destination: logFilePath },
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
      headers: {
        "content-type": req.headers["content-type"],
        "content-length": req.headers["content-length"],
        "authorization": req.headers["authorization"],
      },
      ip: req.headers["x-forwarded-for"] || req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        "content-type": res.headers["content-type"],
        "content-length": res.headers["content-length"],
      },
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

function initLogCounter(): string {
  const logsDir = "data/logs";
  const logCounterFile = path.join(logsDir, "logCounter.txt");

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const nextLogNumber = getNextLogFileNumber(logCounterFile);
  return `${logsDir}/${nextLogNumber}.log`;
}

function getNextLogFileNumber(logCounterFile: string) {
  let lastLogNumber = 0;

  if (fs.existsSync(logCounterFile)) {
    const counterContents = fs.readFileSync(logCounterFile, { encoding: "utf8" });
    lastLogNumber = parseInt(counterContents, 10);
  }

  const nextLogNumber = lastLogNumber + 1;

  fs.writeFileSync(logCounterFile, nextLogNumber.toString(), { encoding: "utf8" });

  return nextLogNumber;
}


export { logger, httpLogger };
