-- Modify the handle_new_user trigger function to avoid conflicts
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert profile
  insert into public.profiles (user_id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  
  -- Insert default role with conflict handling
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;
  
  return new;
end;
$$;