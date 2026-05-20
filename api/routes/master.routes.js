import express from "express";

import { createmasterinventory } from "../controllers/master.controller.js";

const master = express.Router();
master.post("/masterentry", createmasterinventory);

export default master;
