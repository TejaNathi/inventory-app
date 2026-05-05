CREATE TABLE cart_requests(
cart_id  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
member_id uuid REFERENCES members(member_id),
source text NOT NULL,
note text,
 created_at timestamptz DEFAULT now(),
 approved_by uuid REFERENCES members(member_id),
payment_date timestamptz,
invoice_no text,
amount_paid numeric,
total numeric,
status text CHECK (status IN ('pending', 'approved', 'rejected', 'paymentdone', 'delivered'))
 )


