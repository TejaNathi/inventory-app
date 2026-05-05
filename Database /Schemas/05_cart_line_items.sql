

CREATE TABLE cart_line_items(
line_item_id  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
cart_id   uuid REFERENCES cart_requests(cart_id),
item_id uuid REFERENCES master_inventory(item_id),
vendor_name text,
unit_price numeric,
qty numeric,
total numeric,
status text CHECK (status IN ('included', 'removed'))
 )