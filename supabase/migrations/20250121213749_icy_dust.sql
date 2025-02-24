/*
  # Fix user registration permissions

  1. Changes
    - Adjust permissions for user registration
    - Ensure proper function execution permissions
    - Fix trigger permissions for profile creation
    - Add missing RLS policies

  2. Security
    - Maintain RLS policies
    - Keep existing security constraints
*/

-- Ensure the handle_new_user function has proper permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- Ensure the auth schema has proper permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Ensure proper permissions on the auth.users table
GRANT SELECT ON TABLE auth.users TO postgres, authenticated, service_role;
GRANT INSERT ON TABLE auth.users TO anon, authenticated, service_role;

-- Ensure proper permissions on the public.profiles table
GRANT SELECT, INSERT ON TABLE public.profiles TO anon, authenticated, service_role;

-- Ensure the trigger has proper permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add missing RLS policies for profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Enable insert for authentication only'
  ) THEN
    CREATE POLICY "Enable insert for authentication only" 
      ON public.profiles 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
  END IF;
END $$;