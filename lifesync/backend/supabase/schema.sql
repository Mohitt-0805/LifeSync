-- LifeSync Production Supabase PostgreSQL Database Schema
-- Execute this script in your Supabase SQL Editor (https://app.supabase.com -> SQL Editor)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT,
    google_id VARCHAR(255),
    avatar TEXT DEFAULT '',
    role VARCHAR(50) DEFAULT 'user',
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    refresh_token TEXT,
    reset_password_token TEXT,
    reset_password_expire TIMESTAMP WITH TIME ZONE,
    phone_number VARCHAR(50) DEFAULT '',
    whatsapp_opt_in BOOLEAN DEFAULT false,
    whatsapp_verified BOOLEAN DEFAULT false,
    whatsapp_preferences JSONB DEFAULT '{"tasks":true,"goals":true,"events":true,"memberships":true}'::jsonb,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'personal',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Goals Table
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(100) DEFAULT 'career',
    start_date TIMESTAMP WITH TIME ZONE,
    target_date TIMESTAMP WITH TIME ZONE,
    progress INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'not_started',
    milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Goal Milestones Table
CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Habits Table
CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    frequency VARCHAR(50) DEFAULT 'daily',
    target_days INT DEFAULT 1,
    streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Habit Logs Table
CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) DEFAULT 'expense',
    category VARCHAR(100) DEFAULT 'General',
    description TEXT DEFAULT '',
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    period VARCHAR(50) DEFAULT 'monthly',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    content TEXT DEFAULT '',
    folder VARCHAR(100) DEFAULT 'General',
    category VARCHAR(100) DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_all_day BOOLEAN DEFAULT false,
    reminders TEXT[] DEFAULT '{}',
    category VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Activities Table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    badge_code VARCHAR(255),
    badge_icon VARCHAR(255),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    xp_reward INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT DEFAULT '',
    category VARCHAR(100) DEFAULT 'finance',
    level VARCHAR(50) DEFAULT 'beginner',
    cover_emoji VARCHAR(50) DEFAULT '📚',
    accent_color VARCHAR(50) DEFAULT '#8B5CF6',
    order_index INT DEFAULT 0,
    total_lessons INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    difficulty VARCHAR(50) DEFAULT 'beginner',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    content TEXT DEFAULT '',
    order_index INT DEFAULT 0,
    estimated_read_time INT DEFAULT 5,
    quiz JSONB DEFAULT '[]'::jsonb,
    xp_reward INT DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. User Lesson Progress Table
CREATE TABLE IF NOT EXISTS user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    quiz_score INT,
    xp_awarded INT DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Message Logs Table
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    error TEXT DEFAULT '',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Class Schedules Table
CREATE TABLE IF NOT EXISTS class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject_name VARCHAR(255) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    room VARCHAR(100) DEFAULT '',
    color VARCHAR(50) DEFAULT '#3b6cff',
    recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Focus Sessions Table
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INT NOT NULL,
    completed BOOLEAN DEFAULT false,
    linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Columns if table already exists (Schema Auto-Repair Migration)
DO $$
BEGIN
    -- users table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='whatsapp_preferences') THEN
        ALTER TABLE users ADD COLUMN whatsapp_preferences JSONB DEFAULT '{"tasks":true,"goals":true,"events":true,"memberships":true}'::jsonb;
    END IF;
    -- tasks table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='category') THEN
        ALTER TABLE tasks ADD COLUMN category VARCHAR(100) DEFAULT 'personal';
    END IF;
    -- events table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='start_date') THEN
        ALTER TABLE events ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='end_date') THEN
        ALTER TABLE events ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='is_all_day') THEN
        ALTER TABLE events ADD COLUMN is_all_day BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='reminders') THEN
        ALTER TABLE events ADD COLUMN reminders TEXT[] DEFAULT '{}';
    END IF;
    -- expenses table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='description') THEN
        ALTER TABLE expenses ADD COLUMN description TEXT DEFAULT '';
    END IF;
    -- notes table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='folder') THEN
        ALTER TABLE notes ADD COLUMN folder VARCHAR(100) DEFAULT 'General';
    END IF;
    -- habits table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='habits' AND column_name='target_days') THEN
        ALTER TABLE habits ADD COLUMN target_days INT DEFAULT 1;
    END IF;
    -- goals table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='milestones') THEN
        ALTER TABLE goals ADD COLUMN milestones JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='start_date') THEN
        ALTER TABLE goals ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='goals' AND column_name='target_date') THEN
        ALTER TABLE goals ADD COLUMN target_date TIMESTAMP WITH TIME ZONE;
    END IF;
    -- achievements table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='badge_code') THEN
        ALTER TABLE achievements ADD COLUMN badge_code VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='updated_at') THEN
        ALTER TABLE achievements ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    -- notifications table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='updated_at') THEN
        ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    -- activities table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activities' AND column_name='updated_at') THEN
        ALTER TABLE activities ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Allow full access policies for backend service operations
DROP POLICY IF EXISTS "Allow service full access" ON users;
CREATE POLICY "Allow service full access" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON tasks;
CREATE POLICY "Allow service full access" ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON goals;
CREATE POLICY "Allow service full access" ON goals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON goal_milestones;
CREATE POLICY "Allow service full access" ON goal_milestones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON habits;
CREATE POLICY "Allow service full access" ON habits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON habit_logs;
CREATE POLICY "Allow service full access" ON habit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON expenses;
CREATE POLICY "Allow service full access" ON expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON budgets;
CREATE POLICY "Allow service full access" ON budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON notes;
CREATE POLICY "Allow service full access" ON notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON events;
CREATE POLICY "Allow service full access" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON notifications;
CREATE POLICY "Allow service full access" ON notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON activities;
CREATE POLICY "Allow service full access" ON activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON achievements;
CREATE POLICY "Allow service full access" ON achievements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON courses;
CREATE POLICY "Allow service full access" ON courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON lessons;
CREATE POLICY "Allow service full access" ON lessons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON user_lesson_progress;
CREATE POLICY "Allow service full access" ON user_lesson_progress FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON message_logs;
CREATE POLICY "Allow service full access" ON message_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON class_schedules;
CREATE POLICY "Allow service full access" ON class_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service full access" ON focus_sessions;
CREATE POLICY "Allow service full access" ON focus_sessions FOR ALL USING (true) WITH CHECK (true);
