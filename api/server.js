import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./db.js";
import { register } from "./auth/auth.js";
import { logIn } from "./auth/login.auth.js";
import { createServer } from "http";

import router from "./routes/cart.routes.js";
import routers from "../api/routes/inward.routes.js";
import master from "./routes/master.routes.js";
import projects from "./routes/project.routes.js";
import { Server } from "socket.io";
import inventorycode from "./routes/inventory.routes.js";
import outward from "./routes/outward.routes.js";
import requestRoutes from "./routes/request.routes.js";

const app = express();
const httpserver = createServer(app);

app.use(cors());
app.use(express.json());

// routes
app.use("/api/cart", router);

app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

app.use("/api/", routers);

app.use("/api", master);
app.use("/api/outward", outward);

app.get("/api/health", async (req, res) => {
  await query("select 1");
  res.json({ ok: true });
});
app.post("/api/register", register);
app.post("/api/login", logIn);

app.get("/api/inventory", async (req, res) => {
  const result = await query("SELECT * FROM inventory_view");
  res.json(result.rows);
});

app.use("/api/projects", projects);

app.use("/api", inventorycode);
app.use("/api/request", requestRoutes);

export const io = new Server(
  httpserver,

  {
    cors: {
      origin: "*",
    },
  },
);

app.use((req, res, next) => {
  req.io = io;

  next();
});

// make io accessible
app.set("io", io);

io.on(
  "connection",

  (socket) => {
    console.log("socket connected", socket.id);

    socket.on(
      "join",

      (data) => {
        socket.rooms.forEach((room) => {
          if (room !== socket.id) socket.leave(room);
        });
        socket.join(`role:${data.role}`);

        socket.join(`dept:${data.department}`);

        socket.join(`user:${data.user_id}`);

        // COMBINED ROOM
        console.log(`${data.role} is now in rooms:`, [...socket.rooms]);

        socket.join(`role:${data.role}:${data.department}`);

        console.log(`${data.role} joined rooms,${data.department}`);
      },
    );
  },
);

httpserver.listen(
  3000,

  "0.0.0.0",

  () => {
    console.log("Server running on http://192.168.0.203:3000");
  },
);
