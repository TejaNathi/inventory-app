inward_id       PK
item_id         FK → master_inventory
cart_line_id    FK → cart_line_items  nullable
request_id      FK → requests  nullable
vendor_name     text
qty_received    numeric NOT NULL
unit            text NOT NULL
rate_per_unit   numeric
supplier        text
invoice_no      text
received_by     FK → members
delivery_date   date
notes           text
created_at      auto timestamp





CREATE TABLE inward_register(
inward_id  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
cart_line_id   uuid REFERENCES cart_line_items(cart_line_id),
item_id uuid REFERENCES master_inventory(item_id),
request_id  uuid REFERENCES requests(request_id),
vendor_name     text,
qty_received    numeric NOT NULL,
unit            text NOT NULL,
rate_per_unit   numeric,
supplier        text,
invoice_no      text,
received_by    uuid REFERENCES members(member_id),
delivery_date   date,
notes           text,
created_at timestamptz DEFAULT now()
 )