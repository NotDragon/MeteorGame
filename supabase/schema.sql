-- Create meteor_entries table
CREATE TABLE IF NOT EXISTS meteor_entries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    meteors_count INTEGER NOT NULL,
    time_minutes DECIMAL(10, 2) NOT NULL,
    rate_per_hour DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on rate_per_hour for sorting performance
CREATE INDEX idx_meteor_entries_rate ON meteor_entries(rate_per_hour DESC);

-- Create an index on name for search performance
CREATE INDEX idx_meteor_entries_name ON meteor_entries(name);

-- Enable Row Level Security (RLS)
ALTER TABLE meteor_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read all entries
CREATE POLICY "Allow public read access" ON meteor_entries
    FOR SELECT
    TO public
    USING (true);

-- Create a policy that allows anyone to insert entries
CREATE POLICY "Allow public insert access" ON meteor_entries
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Note: In production, you might want to add authentication and more restrictive policies