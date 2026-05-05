


CREATE TABLE projects(
project_id   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
project_name text   NOT NULL,
department    text NOT NULL,
member_id   uuid REFERENCES members(member_id),
status text CHECK (status IN ('active', 'completed', 'onhold')),
date            date,
notes           text,
created_at timestamptz DEFAULT now()
 )