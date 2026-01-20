import express from "express";
import cors from "cors";
import { authRouter } from "./auth";
import { dataRouter } from "./data";
import { errorHandler } from "./error";

export const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/data", dataRouter);

app.use(errorHandler);
