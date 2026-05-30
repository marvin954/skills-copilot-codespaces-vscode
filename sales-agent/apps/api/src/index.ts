import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { leadsRouter } from "./routes/leads.js";
import { dealsRouter } from "./routes/deals.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { workflowRouter } from "./routes/workflow.js";
import { controlRouter } from "./routes/control.js";
import { playbooksRouter } from "./routes/playbooks.js";
import { optOutRouter } from "./routes/optOut.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = Number(process.env.API_PORT) || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use("/webhooks/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sales-agent-api" });
});

app.use("/api/leads", leadsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/workflow", workflowRouter);
app.use("/api/control", controlRouter);
app.use("/api/playbooks", playbooksRouter);
app.use("/api/opt-out", optOutRouter);
app.use("/webhooks", webhooksRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Sales Agent API listening on :${port}`);
});
