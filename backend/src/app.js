import express from "express";
import cors from "cors";

import authRoutes from "./auth/auth.routes.js";
import userRoutes from "./users/user.routes.js";
import walletRoutes from "./wallets/wallet.routes.js";
import tradeRoutes from "./trading/trade.routes.js";
import binaryRoutes from "./binary/binary.routes.js";
import aiRoutes from "./ai/ai.routes.js";
import adminRoutes from "./admin/admin.routes.js";
import masterRoutes from "./master/master.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/wallets", walletRoutes);
app.use("/trades", tradeRoutes);
app.use("/binary", binaryRoutes);
app.use("/ai", aiRoutes);
app.use("/admin", adminRoutes);
app.use("/master", masterRoutes);

export default app;
