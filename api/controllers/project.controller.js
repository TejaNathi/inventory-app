import {

  createProject,
  getProjects

}from '../models/project.models.js';

export async function createProjectController(
  req,
  res
) {

  try {

    const result =
      await createProject(
        req.body
      );

    res.status(201).json(
      result
    );

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed creating project'

    });

  }

}

export async function getProjectsController(
  req,
  res
) {

  try {

    const result =
      await getProjects();

    res.json(result);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed loading projects'

    });

  }

}
