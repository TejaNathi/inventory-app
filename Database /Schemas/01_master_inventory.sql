CREATE  TABLE master_inventory (
  item_id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_Name text NOT NULL UNIQUE,
category  text NOT NULL,
unit  text NOT NULL ,
opening_stock  integer NOT NULL,
current_qty integer NOT NULL,
reorder_level  integer NOT NULL,
department  text NOT NULL,
rate_per_unit  numeric NOT NULL
  );