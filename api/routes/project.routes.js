import express
from 'express';

import {

  createProjectController,
  getProjectsController

}

from '../controllers/project.controller.js';

const projects =
  express.Router();

projects.post(
  '/',
  createProjectController
);

projects.get(
  '/',
  getProjectsController
);

export default projects;