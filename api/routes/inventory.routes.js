import express
from 'express';
import { authed } from '../middleware/auth.middleware.js';

import {

  createInventoryItemController,

  getInventoryItemsController,

  createAliasController,

  getAliasesController

}

from '../controllers/inventory.controller.js';

const inventorycode =
  express.Router();


// ---------------------
// INVENTORY ITEMS
// ---------------------

inventorycode.post(

  '/inventory-items',

  createInventoryItemController

);

inventorycode.get(

  '/inventory-view', authed,

  getInventoryItemsController

);


// ---------------------
// ITEM ALIASES
// ---------------------

inventorycode.post(

  '/item-aliases',

  createAliasController

);

inventorycode.get(

  '/item-aliases/:item_id',

  getAliasesController

);
inventorycode.get(
  '/test',
  authed,
  
  (req, res) => {

    console.log(req.user);

    res.json(req.user);

  }
);

export default inventorycode;