import{
    masterinward
} from "../models/master.models.js"

export async function createmasterinventroy(req,res){
try{
const {inwardentries}=req.body;

if(!inwardentries||!inwardentries.length){
    return res.status(400).json({
        error: "inwardentries not there"});
}

const result = await  masterinward(inwardentries);
res.status(200).json({
    entries:result
    
});

}

catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        'Failed inward entry'

    });

  }





}