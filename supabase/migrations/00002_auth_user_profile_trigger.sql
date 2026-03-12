-- Auto-create public.users profile when an auth.users row is created.
-- Reads username from raw_user_meta_data set during signUp.
-- SECURITY DEFINER bypasses RLS so the insert works even without a session
-- (e.g. when email confirmation is enabled).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
