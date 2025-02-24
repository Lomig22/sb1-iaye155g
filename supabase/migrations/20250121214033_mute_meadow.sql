-- Ensure anonymous users can sign up
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anon users only"
ON auth.users
FOR INSERT
TO anon
WITH CHECK (true);

-- Grant necessary permissions to the auth schema and tables
GRANT USAGE ON SCHEMA auth TO anon;
GRANT ALL ON TABLE auth.users TO anon;
GRANT ALL ON TABLE public.profiles TO anon;

-- Ensure the handle_new_user function has proper permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER SET search_path = public;

-- Add explicit policy for profile creation
CREATE POLICY "Allow profile creation for new users"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure proper trigger execution permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();