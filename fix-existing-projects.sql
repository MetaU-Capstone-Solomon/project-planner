-- Fix existing projects by adding creators as admin collaborators

-- Add all existing project creators as admin collaborators
INSERT INTO project_collaborators (project_id, user_id, role, status)
SELECT 
  r.id as project_id,
  r.user_id,
  'admin' as role,
  'accepted' as status
FROM roadmap r
WHERE r.user_id IS NOT NULL
AND NOT EXISTS (frone
  SELECT 1 FROM project_collaborators pc 
  WHERE pc.project_id = r.id 
  AND pc.user_id = r.user_id
);

-- Log the activity for each project
INSERT INTO project_activities (project_id, user_id, activity_type, description)
SELECT 
  r.id as project_id,
  r.user_id,
  'project_created' as activity_type,
  'Project created' as description
FROM roadmap r
WHERE r.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM project_activities pa 
  WHERE pa.project_id = r.id 
  AND pa.activity_type = 'project_created'
);
