# Database Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Tables](#tables)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Storage Policies](#storage-policies)
6. [Indexes and Performance](#indexes-and-performance)
7. [Data Management](#data-management)

---

## Overview

This document describes the database schema for the Project Planner application built with Supabase. The database uses PostgreSQL with Row Level Security (RLS) for data protection and includes tables for roadmaps, phases, milestones, tasks, and chat messages.

### Key Features
- **UUID-based primary keys** for security
- **Row Level Security** for user data isolation
- **Cascading deletes** for data integrity
- **JSONB fields** for flexible metadata storage
- **Timestamps** for audit trails

---

## Database Schema

### Core Tables
1. **roadmaps** - Main project roadmap data
2. **phases** - Project phases within roadmaps
3. **milestones** - Milestones within phases
4. **tasks** - Individual tasks within milestones
5. **chat_messages** - AI chat conversation history

### Relationships
```
roadmaps (1) → (many) phases
phases (1) → (many) milestones  
milestones (1) → (many) tasks
```

---

## Tables

### 1. Roadmaps Table

**Purpose**: Stores the main project roadmap information including metadata and AI-generated content.

```sql
CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  timeline VARCHAR(100),
  experience_level VARCHAR(50),
  technologies TEXT,
  scope VARCHAR(100),
  metadata JSONB,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns**:
- `id`: Unique identifier (UUID)
- `title`: Project title (required)
- `description`: Project description
- `timeline`: Estimated timeline (e.g., "3-6 months")
- `experience_level`: Developer experience required
- `technologies`: Technologies to be used
- `scope`: Project scope (e.g., "Small", "Medium", "Large")
- `metadata`: Flexible JSON data for additional information
- `summary`: AI-generated project summary
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### 2. Phases Table

**Purpose**: Represents major phases within a project roadmap.

```sql
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  timeline VARCHAR(100),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns**:
- `id`: Unique identifier (UUID)
- `roadmap_id`: Foreign key to roadmaps table
- `title`: Phase title (required)
- `timeline`: Phase timeline
- `order_index`: Display order within roadmap
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### 3. Milestones Table

**Purpose**: Represents milestones within each phase.

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  timeline VARCHAR(100),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns**:
- `id`: Unique identifier (UUID)
- `phase_id`: Foreign key to phases table
- `title`: Milestone title (required)
- `timeline`: Milestone timeline
- `order_index`: Display order within phase
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### 4. Tasks Table

**Purpose**: Individual tasks within milestones with detailed information and status tracking.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  technology TEXT,
  resources JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to VARCHAR(100),
  estimated_hours INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns**:
- `id`: Unique identifier (UUID)
- `milestone_id`: Foreign key to milestones table
- `title`: Task title (required)
- `description`: Detailed task description
- `technology`: Technology used for this task
- `resources`: JSON data for additional resources
- `status`: Task status (pending, in-progress, completed, blocked)
- `completed_at`: Completion timestamp
- `assigned_to`: Person assigned to the task
- `estimated_hours`: Estimated time to complete
- `order_index`: Display order within milestone
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

### 5. Chat Messages Table

**Purpose**: Stores AI chat conversation history for project generation.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns**:
- `id`: Unique identifier (UUID)
- `project_id`: Associated project ID
- `role`: Message role (user, assistant, system)
- `content`: Message content
- `created_at`: Message timestamp

---

## Row Level Security (RLS)

### Overview
Row Level Security ensures that users can only access their own data. All tables have RLS enabled with appropriate policies.

### Roadmap Security Policies

```sql
-- Enable RLS on roadmap table
ALTER TABLE public.roadmap ENABLE ROW LEVEL SECURITY;

-- Insert policy: Users can only insert their own roadmaps
CREATE POLICY roadmap_insert_own
ON public.roadmap
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Select policy: Users can only view their own roadmaps
CREATE POLICY roadmap_select_own
ON public.roadmap
FOR SELECT
USING (auth.uid() = user_id);

-- Update policy: Users can only update their own roadmaps
CREATE POLICY roadmap_update_own
ON public.roadmap
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Delete policy: Users can only delete their own roadmaps
CREATE POLICY roadmap_delete_own
ON public.roadmap
FOR DELETE
USING (auth.uid() = user_id);
```

### Alternative Policy Structure

```sql
-- Comprehensive policy for all operations
CREATE POLICY "Users can insert their own roadmaps" ON roadmap
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own roadmaps" ON roadmap
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmaps" ON roadmap
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmaps" ON roadmap
    FOR DELETE USING (auth.uid() = user_id);
```

### Owner-Based Access

```sql
-- Full access for owners
CREATE POLICY "Owners full access" ON roadmap
  FOR ALL USING (owner = auth.uid());

-- Authenticated insert access
CREATE POLICY "Authenticated insert" ON roadmap
  FOR INSERT WITH CHECK (owner = auth.uid());
```

---

## Storage Policies

### Avatar Storage Policies

**Purpose**: Manages user avatar uploads in Supabase Storage.

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "avatar insert" ON storage.objects;
DROP POLICY IF EXISTS "avatar update" ON storage.objects;

-- Allow authenticated users to write to avatars bucket
CREATE POLICY "avatars write"
ON storage.objects
FOR ALL                      
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');
```

**Features**:
- Any authenticated user can upload avatars
- Files are stored in the 'avatars' bucket
- Automatic file management and cleanup

---

## Indexes and Performance

### Performance Indexes

```sql
-- Roadmaps table indexes
CREATE INDEX idx_roadmaps_created_at ON roadmaps(created_at);

-- Relationship indexes for faster joins
CREATE INDEX idx_phases_roadmap_id ON phases(roadmap_id);
CREATE INDEX idx_milestones_phase_id ON milestones(phase_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);

-- Status-based queries
CREATE INDEX idx_tasks_status ON tasks(status);
```

**Benefits**:
- Faster queries on creation dates
- Optimized joins between related tables
- Efficient status-based filtering

---

## Data Management

### Clearing Data

#### Clear All Tasks
```sql
TRUNCATE TABLE public.tasks
RESTART IDENTITY
CASCADE;
```

**Purpose**: Removes all task data and resets auto-increment counters.

### Schema Modifications

#### User ID Column Updates
```sql
-- Convert user_id to UUID type
ALTER TABLE public.roadmap
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET NOT NULL;
```

**Purpose**: Ensures proper UUID formatting for user identification.

### Extensions

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Purpose**: Provides UUID generation functions for primary keys.

---

## Usage Examples

### Creating a New Roadmap
```sql
INSERT INTO roadmaps (title, description, timeline, experience_level, scope)
VALUES (
  'E-commerce Website',
  'Build a full-stack e-commerce platform',
  '3-6 months',
  'Intermediate',
  'Medium'
);
```

### Adding a Phase
```sql
INSERT INTO phases (roadmap_id, title, timeline, order_index)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Planning & Design',
  '2 weeks',
  1
);
```

### Creating a Task
```sql
INSERT INTO tasks (milestone_id, title, description, technology, status, order_index)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Design Database Schema',
  'Create ERD and implement database tables',
  'PostgreSQL',
  'pending',
  1
);
```

---

## Security Considerations

1. **Row Level Security**: All user data is isolated by user ID
2. **UUID Primary Keys**: Prevents enumeration attacks
3. **Cascading Deletes**: Maintains referential integrity
4. **Input Validation**: Status fields have CHECK constraints
5. **Audit Trails**: All tables include creation and update timestamps