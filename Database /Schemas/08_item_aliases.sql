


CREATE TABLE item_aliases(
alias_id  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
item_id uuid REFERENCES master_inventory(item_id),
created_by   uuid REFERENCES members(member_id),
vendor_name     text NOT NULL UNIQUE,
source          text,
created_at timestamptz DEFAULT now()
 )