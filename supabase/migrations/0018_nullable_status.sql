-- A newly created/imported lead should show a neutral "Status" placeholder
-- until someone explicitly sets it (e.g. to Outreach Initiated), instead of
-- defaulting straight to Outreach Initiated.
alter table leads alter column status drop not null;
alter table leads alter column status drop default;
