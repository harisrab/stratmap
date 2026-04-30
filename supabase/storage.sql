insert into storage.buckets (id, name, public)
values ('stratmap-workspace', 'stratmap-workspace', false)
on conflict (id) do nothing;
