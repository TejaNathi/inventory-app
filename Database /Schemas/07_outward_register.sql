CREATE TABLE outward_register(
  outward_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  item_id uuid REFERENCES master_inventory(item_id),

  member_id uuid REFERENCES members(member_id),

  project_id uuid REFERENCES projects(project_id),

  unit text NOT NULL,

  outward_type text CHECK (outward_type IN ('usage', 'wip', 'allocated')),

  work_order_ref text,

  qty_used numeric NOT NULL CHECK (qty_used > 0),

  date date DEFAULT CURRENT_DATE,

  notes text,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT wip_requires_project
  CHECK (
    (outward_type = 'wip' AND project_id IS NOT NULL)
    OR
    (outward_type != 'wip')
  )
);