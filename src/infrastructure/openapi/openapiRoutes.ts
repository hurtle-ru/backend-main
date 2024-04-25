import * as swaggerJson from "../../../dist/swagger.json";
import * as swaggerUI from "swagger-ui-express";
import path from "path";
import { Express } from "express";

export function setupSwaggerRoutes(app: Express) {
  const swaggerOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  app.use(["/openapi", "/docs", "/swagger"], swaggerUI.serve, swaggerUI.setup(swaggerJson, swaggerOptions));
  app.get("/api/redoc", (req, res) => {
    res.sendFile(path.join(__dirname, "redoc.html"));
  });
  app.get("/api/swagger.json", (req, res) => {
    res.send(swaggerJson);
  });
}
