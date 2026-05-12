import { query } from '../db.js';


export async function masterinward(
  inwardItems
) {

const promise = inwardItems.map(item=>

query(

    `INSERT INTO master_inventory(

    canonical_name,
  category,
  unit,
  current_stock,
  reorder_level,
  department,
  rate_per_unit,
  item_code)

     values(
     $1,
     $2,
     $3,
     $4,
      $5,
     $6,$7,
     $8)

     ON CONFLICT (canonical_name)

DO UPDATE SET

  current_stock =

    master_inventory.current_stock
    + EXCLUDED.current_stock

RETURNING * `,


     [
     
     
        

          item.canonical_name,

           item.category,

          item.unit,

          item.qty_received,

          5,

          item.department,

         
          item.rate_per_unit,

          item.item_code
     
     
     
     ]



)

);

    
}