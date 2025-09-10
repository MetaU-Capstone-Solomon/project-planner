-- =====================================================
-- PROJECT COLLABORATION SYSTEM - DATABASE MIGRATION
-- =====================================================
-- This migration adds collaboration features to the existing project planner

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROJECT COLLABORATORS TABLE
-- =====================================================
-- Tracks user roles and permissions for each project
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES roadmap(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique collaboration per project per user
  UNIQUE(project_id, user_id)
);

-- =====================================================
-- 2. PROJECT INVITATIONS TABLE
-- =====================================================
-- Tracks email-based invitations for users not yet registered
CREATE TABLE IF NOT EXISTS project_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES roadmap(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique invitation per project per email
  UNIQUE(project_id, email)
);

-- =====================================================
-- 3. PROJECT ACTIVITIES TABLE
-- =====================================================
-- Tracks all project activities for audit and real-time updates
CREATE TABLE IF NOT EXISTS project_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES roadmap(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. PERFORMANCE INDEXES
-- =====================================================
-- Optimize queries for collaboration features

-- Project collaborators indexes
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_role ON project_collaborators(role);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);

-- Project invitations indexes
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON project_invitations(status);
CREATE INDEX IF NOT EXISTS idx_project_invitations_expires_at ON project_invitations(expires_at);

-- Project activities indexes
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_user_id ON project_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_activity_type ON project_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at ON project_activities(created_at);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all collaboration tables
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROJECT COLLABORATORS POLICIES
-- =====================================================

-- Users can view collaborators for projects they're part of
CREATE POLICY "Users can view project collaborators" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_collaborators.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.status = 'accepted'
    )
  );

-- Users can insert collaborators if they're admin of the project
CREATE POLICY "Admins can add collaborators" ON project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_collaborators.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.role = 'admin' 
      AND pc.status = 'accepted'
    )
  );

-- Users can update their own collaboration status
CREATE POLICY "Users can update own collaboration status" ON project_collaborators
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can update any collaborator in their projects
CREATE POLICY "Admins can update collaborators" ON project_collaborators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_collaborators.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.role = 'admin' 
      AND pc.status = 'accepted'
    )
  );

-- Admins can delete collaborators from their projects
CREATE POLICY "Admins can remove collaborators" ON project_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_collaborators.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.role = 'admin' 
      AND pc.status = 'accepted'
    )
  );

-- =====================================================
-- PROJECT INVITATIONS POLICIES
-- =====================================================

-- Users can view invitations for projects they're admin of
CREATE POLICY "Admins can view project invitations" ON project_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_invitations.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.role = 'admin' 
      AND pc.status = 'accepted'
    )
  );

-- Admins can create invitations for their projects
CREATE POLICY "Admins can create invitations" ON project_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_invitations.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.role = 'admin' 
      AND pc.status = 'accepted'
    )
  );

-- Admins can update invitations for their projects
CREATE POLICY "Admins can update invitations" ON project_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_invitations.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.role = 'admin' 
      AND pc.status = 'accepted'
    )
  );

-- Admins can delete invitations for their projects
CREATE POLICY "Admins can delete invitations" ON project_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_invitations.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.role = 'admin' 
      AND pc.status = 'accepted'
    )
  );

-- =====================================================
-- PROJECT ACTIVITIES POLICIES
-- =====================================================

-- Users can view activities for projects they're part of
CREATE POLICY "Users can view project activities" ON project_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_activities.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.status = 'accepted'
    )
  );

-- Users can create activities for projects they're part of
CREATE POLICY "Users can create project activities" ON project_activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators pc 
      WHERE pc.project_id = project_activities.project_id 
      AND pc.user_id = auth.uid() 
      AND pc.status = 'accepted'
    )
  );

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to automatically add project creator as admin
CREATE OR REPLACE FUNCTION add_project_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the project creator as admin collaborator
  INSERT INTO project_collaborators (project_id, user_id, role, status)
  VALUES (NEW.id, NEW.user_id, 'admin', 'accepted');
  
  -- Log the activity
  INSERT INTO project_activities (project_id, user_id, activity_type, description)
  VALUES (NEW.id, NEW.user_id, 'project_created', 'Project created');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add creator as admin
CREATE TRIGGER trigger_add_project_creator_as_admin
  AFTER INSERT ON roadmap
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_admin();

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE project_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. UPDATE EXISTING ROADMAP TABLE
-- =====================================================

-- Add updated_at trigger to roadmap table if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to roadmap table
DROP TRIGGER IF EXISTS trigger_roadmap_updated_at ON roadmap;
CREATE TRIGGER trigger_roadmap_updated_at
  BEFORE UPDATE ON roadmap
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


