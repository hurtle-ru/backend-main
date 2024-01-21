import cors from "cors";

export default cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
