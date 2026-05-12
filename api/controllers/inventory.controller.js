import {

  createInventoryItem,

  getInventoryItems,

  createAlias,

  getAliasesByItemId

}

from '../models/inventory.model.js';


function normalizeDepartmentCode(department) {

  const value = String(department || '')
    .trim();

  const map = {
    mechanical: 'MEC',
    electrical: 'EMB',
    embedded: 'EMB',
    'embedded systems': 'EMB',
    software: 'SOF',
    operations: 'OPE'
  };

  return map[value.toLowerCase()]
    || value.slice(0, 3).toUpperCase();

}


// ---------------------
// CREATE INVENTORY ITEM
// ---------------------

export async function createInventoryItemController(
  req,
  res
) {

  try {

    const result =

      await createInventoryItem({
        ...req.body,
        department_code:
          normalizeDepartmentCode(
            req.body.department_code
          )
      });

    res.json(result);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed creating inventory item'

    });

  }

}




export async function getInventoryItemsController(
  req,
  res
) {

  try {

    
const department =
  req.user?.department;

if (!department) {

  return res.status(400)
    .json({
      error:
        'Department missing'
    });

}
 const department_code =
      normalizeDepartmentCode(
        department
      );

    console.log(
      'USER DEPARTMENT:',
      department
    );

    console.log(
      'DEPARTMENT CODE:',
      department_code
    );

        
    const result =
      await getInventoryItems(
        department_code
      );

 console.log(
      'familugroup:',
      result);
    res.json(result);
    



  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed loading inventory items'

    });

  }

}


// ---------------------
// CREATE ALIAS
// ---------------------

export async function createAliasController(
  req,
  res
) {

  try {

    const result =
      await createAlias(
        req.body
      );

    res.json(result);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed creating alias'

    });

  }

}


// ---------------------
// GET ALIASES
// ---------------------

export async function getAliasesController(
  req,
  res
) {

  try {

    const result =

      await getAliasesByItemId(
        req.params.item_id
      );

    res.json(result);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed loading aliases'

    });

  }

}