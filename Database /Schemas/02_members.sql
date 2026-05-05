--A name
--A department
--A role — member, lead, or accounts


CREATE  TABLE members (
    member_id   uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    member_name text NOT NULL,

    department text  NOT NULL,

    role text CHECK (role IN ('member', 'lead', 'accounts'))

l