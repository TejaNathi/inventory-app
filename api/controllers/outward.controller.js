import {

  createOutwardEntry,

  getOutwardEntries,

  getProjectOutward

} from '../models/outward.models.js';



// ======================
// CREATE OUTWARD
// ======================

export async function createOutwardController(
  req,
  res
) {

  try {

    const outwardItems =
      req.body.outwardItems;

    const saved = [];

    for (const item of outwardItems) {

      const result =

        await createOutwardEntry({

          ...item,

          member_id:
            req.user.user_id

        });

      saved.push(result);

    }

    res.status(201).json(
      saved
    );

  }

catch (err) {

  console.error(
    'OUTWARD ERROR:',
    err
  );

  console.error(
    'OUTWARD BODY:',
    req.body
  );

  res.status(500).json({

    error:
      err.message

  });

}}



// ======================
// GET ALL OUTWARD
// ======================

export async function getOutwardController(
  req,
  res
) {

  try {

    const result =
      await getOutwardEntries();

    res.json(result);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed loading outward'

    });

  }

}



// ======================
// GET PROJECT OUTWARD
// ======================

export async function getProjectOutwardController(
  req,
  res
) {

  try {

    const result =

      await getProjectOutward(
        req.params.project_id
      );

    res.json(result);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed loading project outward'

    });

  }

}