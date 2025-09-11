-- =====================================================
-- FIX RLS POLICIES - REMOVE INFINITE RECURSION
-- =====================================================
-- This script fixes the infinite recursion in project_collaborators RLS policies

-- Drop ALL existing policies on project_collaborators table
DROP POLICY IF EXISTS "Users can view project collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Admins can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Admins can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Admins can remove collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update own collaboration status" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view own collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can view collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;

-- Create simpler, non-recursive policies-- Users can view their own collaboration records
CREATE POLICY "Users can view own collaborations" ON project_collaborators
  FOR SELECT USING (user_id = auth.uid());

-- Users can view collaborators for projects they own (from roadmap table)
CREATE POLICY "Project owners can view collaborators" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM roadmap r 
      WHERE r.id = project_collaborators.project_id 
      AND r.user_id = auth.uid()
    )
  );

-- Users can insert collaborators if they own the project
CREATE POLICY "Project owners can add collaborators" ON project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM roadmap r 
      WHERE r.id = project_collaborators.project_id 
      AND r.user_id = auth.uid()
    )
  );

-- Users can update their own collaboration status
CREATE POLICY "Users can update own collaboration status" ON project_collaborators
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Project owners can update any collaborator in their projects
CREATE POLICY "Project owners can update collaborators" ON project_collaborators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM roadmap r 
      WHERE r.id = project_collaborators.project_id 
      AND r.user_id = auth.uid()
    )
  );

-- Project owners can delete collaborators from their projects
CREATE POLICY "Project owners can remove collaborators" ON project_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM roadmap r 
      WHERE r.id = project_collaborators.project_id 
      AND r.user_id = auth.uid()
    )
  );
