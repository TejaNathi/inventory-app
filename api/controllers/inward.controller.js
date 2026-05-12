import {

  fetchInwardEntries

} from '../models/inward.models.js';

export async function getInwardEntries(
  req,
  res
) {

  try {

    const entries =
      await fetchInwardEntries();

    res.json(entries);

  } catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed inward fetch'

    });

  }

}