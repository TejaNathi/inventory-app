import express from "express";

import {
  createProjectController,
  deleteProjectController,
  getProjectsController,
  getWIPProjectsController,
  moveWipItemController,
  returnWipItemController,
} from "../controllers/project.controller.js";

const projects = express.Router();

projects.post("/", createProjectController);
projects.get("/", getProjectsController);
projects.get("/wip", getWIPProjectsController);
projects.delete("/:project_id", deleteProjectController);
projects.patch("/wip-item/:outward_id/move", moveWipItemController);
projects.patch("/wip-item/:outward_id/return", returnWipItemController);

export default projects;
