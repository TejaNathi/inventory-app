import express from "express";

import {
  createProjectController,
  getProjectsController,
  getWIPProjectsController,
} from "../controllers/project.controller.js";

const projects = express.Router();

projects.post("/", createProjectController);

projects.get("/", getProjectsController);
projects.get(
  "/wip",

  getWIPProjectsController,
);
export default projects;
