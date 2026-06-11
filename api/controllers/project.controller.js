import {
  createProject,
  deleteProject,
  getProjects,
  getWIPProjects,
  moveWipItemToProject,
  returnWipItemToMaster,
} from "../models/project.models.js";

export async function createProjectController(req, res) {
  try {
    const result = await createProject(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed creating project" });
  }
}

export async function getProjectsController(req, res) {
  try {
    const result = await getProjects();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed loading projects" });
  }
}

export async function getWIPProjectsController(req, res) {
  try {
    const result = await getWIPProjects();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed loading WIP" });
  }
}

export async function deleteProjectController(req, res) {
  try {
    const result = await deleteProject(req.params.project_id);

    console.log("results", result);
    const io = req.app.get("io");

    io.emit(
      "outward:deleted",

      {
        updateditems: result,
      },
    );
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed deleting project" });
  }
}

export async function moveWipItemController(req, res) {
  try {
    const result = await moveWipItemToProject(
      req.params.outward_id,
      req.body.target_project_id,
    );
    if (!result) {
      return res.status(404).json({ error: "WIP item not found" });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed moving WIP item" });
  }
}

export async function returnWipItemController(req, res) {
  try {
    const result = await returnWipItemToMaster(req.params.outward_id);

    res.json(result);
  } catch (err) {
    console.error(err);
    console.error(err.message);
    console.error(err.detail);

    res.status(500).json({
      error: err.message,
    });
  }
}
