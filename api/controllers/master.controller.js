import { masterinward } from "../models/master.models.js";
import { io } from "../server.js";

export async function createmasterinventory(req, res) {
  try {
    const { inwardentries } = req.body;

    if (!inwardentries || !inwardentries.length) {
      return res.status(400).json({ error: "inwardentries not there" });
    }

    const updatedItems = await masterinward(inwardentries);
    console.log("updatedItems from model:", updatedItems);

    // key matches what client reads
    res.status(200).json({ updatedItems });

    // key matches what client listens for
    console.log("emitting inventory:updated");
    io.to("role:accounts").emit("inventory:updated", { updatedItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed inward entry" });
  }
}
