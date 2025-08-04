# Supabase Setup Instructions

This app uses Supabase for data persistence. Follow these steps to set it up:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - Name: `meteor-counter` (or any name you prefer)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
5. Click "Create new project" and wait for it to provision

## 2. Create the Database Table

1. In your Supabase dashboard, go to the "SQL Editor" tab
2. Copy and paste the contents of `supabase/schema.sql` into the editor
3. Click "Run" to create the table and indexes

## 3. Get Your API Keys

1. Go to "Settings" → "API" in your Supabase dashboard
2. Copy these values:
   - **Project URL**: (looks like `https://xxxxx.supabase.co`)
   - **anon/public** key: (a long string starting with `eyJ...`)

## 4. Set Up Environment Variables

### For Local Development:

Create a `.env.local` file in your project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### For Vercel Deployment:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add these variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon/public key

## 5. Test Your Setup

1. Run `npm run dev` locally
2. Submit a meteor observation
3. Check your Supabase dashboard under "Table Editor" → "meteor_entries" to see the data

## Security Notes

- The anon/public key is safe to use in client-side code
- Row Level Security (RLS) is enabled with public read/write access
- For production apps, consider adding authentication and more restrictive RLS policies

## Fallback Mode

If Supabase is not configured (missing environment variables), the app will automatically fall back to in-memory storage, which is useful for:
- Local development without database setup
- Demo environments
- Testing

## Troubleshooting

### "Error reading entries from Supabase"
- Check that your environment variables are set correctly
- Verify the table was created successfully
- Check Supabase dashboard for any service issues

### Data not persisting locally
- Make sure you have created the `.env.local` file (not just `.env`)
- Restart your dev server after adding environment variables

### Deployment issues
- Ensure environment variables are added to your hosting platform
- Redeploy after adding environment variables
- Check deployment logs for any errors