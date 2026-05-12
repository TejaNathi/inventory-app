import express from 'express';

import {

  getInwardEntries

} from '../controllers/inward.controller.js';


const routers = express.Router();
routers.get(
  '/inwardentry',
  getInwardEntries
);

export default routers;