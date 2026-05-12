import express from 'express';


import {
createmasterinventroy
  

} from '../controllers/master.controller.js';


const master = express.Router();
master.post(
  '/masterentry',
  createmasterinventroy
);

export default master;