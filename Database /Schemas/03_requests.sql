CREATE TABLE requests(
request_id  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
item_id uuid REFERENCES master_inventory(item_id),
member_id uuid REFERENCES members(member_id),
qty_requested integer NOT NULL,
units text NOT NULL,
purpose text,
est_rate numeric,
status text CHECK (status IN ('pending', 'approved', 'rejected', 'paymentdone', 'delivered')),
 created_at timestamptz DEFAULT now(),
 aproved_by uuid REFERENCES members(member_id),
 aproved_at   timestamptz 
 )














