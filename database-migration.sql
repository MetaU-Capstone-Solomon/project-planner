-- Create roadmap table for storing generated project roadmaps


CREATE TABLE IF NOT EXISTS roadmap (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE roadmap ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own roadmaps
CREATE POLICY "Users can insert their own roadmaps" ON roadmap
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow users to view their own roadmaps
CREATE POLICY "Users can view their own roadmaps" ON roadmap
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create policy to allow users to update their own roadmaps
CREATE POLICY "Users can update their own roadmaps" ON roadmap
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create policy to allow users to delete their own roadmaps
CREATE POLICY "Users can delete their own roadmaps" ON roadmap
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add user_id column to track ownership 
ALTER TABLE roadmap ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update policies to use user_id for ownership
DROP POLICY IF EXISTS "Users can insert their own roadmaps" ON roadmap;
DROP POLICY IF EXISTS "Users can view their own roadmaps" ON roadmap;
DROP POLICY IF EXISTS "Users can update their own roadmaps" ON roadmap;
DROP POLICY IF EXISTS "Users can delete their own roadmaps" ON roadmap;

CREATE POLICY "Users can insert their own roadmaps" ON roadmap
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own roadmaps" ON roadmap
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps" ON roadmap
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps" ON roadmap
    FOR DELETE USING (auth.uid() = user_id);