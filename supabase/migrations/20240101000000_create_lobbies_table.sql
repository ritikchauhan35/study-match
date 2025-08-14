-- Create lobbies table
CREATE TABLE IF NOT EXISTS public.lobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subjects TEXT[] NOT NULL,
  user_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_full BOOLEAN DEFAULT false
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to select lobbies
CREATE POLICY "Allow anyone to select lobbies" 
  ON public.lobbies 
  FOR SELECT 
  USING (true);

-- Create policy to allow anyone to insert lobbies
CREATE POLICY "Allow anyone to insert lobbies" 
  ON public.lobbies 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow anyone to update lobbies
CREATE POLICY "Allow anyone to update lobbies" 
  ON public.lobbies 
  FOR UPDATE 
  USING (true);

-- Create policy to allow anyone to delete lobbies
CREATE POLICY "Allow anyone to delete lobbies" 
  ON public.lobbies 
  FOR DELETE 
  USING (true);

-- Create function to create lobbies table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_lobbies_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lobbies') THEN
    CREATE TABLE public.lobbies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      subjects TEXT[] NOT NULL,
      user_count INTEGER NOT NULL DEFAULT 0,
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
      is_full BOOLEAN DEFAULT false
    );
    
    -- Set up RLS (Row Level Security)
    ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
    
    -- Create policy to allow anyone to select lobbies
    CREATE POLICY "Allow anyone to select lobbies" 
      ON public.lobbies 
      FOR SELECT 
      USING (true);
    
    -- Create policy to allow anyone to insert lobbies
    CREATE POLICY "Allow anyone to insert lobbies" 
      ON public.lobbies 
      FOR INSERT 
      WITH CHECK (true);
    
    -- Create policy to allow anyone to update lobbies
    CREATE POLICY "Allow anyone to update lobbies" 
      ON public.lobbies 
      FOR UPDATE 
      USING (true);
    
    -- Create policy to allow anyone to delete lobbies
    CREATE POLICY "Allow anyone to delete lobbies" 
      ON public.lobbies 
      FOR DELETE 
      USING (true);
  END IF;
END;
$$;