import express
from 'express';

import {

  createOutwardController,

  getOutwardController,

  getProjectOutwardController

} from '../controllers/outward.controller.js';

import {

  authed

} from '../middleware/auth.middleware.js';



const outward =
  express.Router();



// CREATE OUTWARD

outward.post(

  '/',

  authed,

  createOutwardController

);



// GET ALL OUTWARD

outward.get(

  '/',

  authed,

  getOutwardController

);



// GET PROJECT OUTWARD

outward.get(

  '/project/:project_id',

  authed,

  getProjectOutwardController

);



export default outward;
