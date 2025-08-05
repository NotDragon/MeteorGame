# 🌠 Meteor Counter

A modern, interactive meteor sighting tracker with leaderboard functionality.

## Features

- **Observation Form**: Record your name, meteor count, and observation time
- **Smart Leaderboard**: Automatically sorted by meteors per hour rate
- **Color-Coded Results**: Green for above-average rates, red for below-average
- **Special Entries**: Shows expected rate (60/hr) and calculated average
- **Search & Filter**: Find specific observers
- **Responsive Design**: Works on desktop and mobile

## Quick Start

1. **Local Development**:
   ```bash
   npm install
   npm run dev
   ```

2. **With Supabase** (for persistent data):
   - Create a [Supabase](https://supabase.com) project
   - Run the SQL from `supabase/schema.sql` in your Supabase SQL editor
   - Copy `.env.example` to `.env.local` and add your credentials
   - Restart the dev server

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
4. Deploy

### Other Platforms

Works on any platform that supports SvelteKit. Just add the same environment variables.

## How It Works

1. Enter your observation details in the form
2. Your rate is calculated automatically (meteors/hour)
3. Results are sorted by rate with color coding:
   - 🟢 **Green**: Above average performance
   - 🔴 **Red**: Below average performance
   - ⭐ **Gold**: Expected rate (60/hr)
   - 🔵 **Blue**: Average of all observations

## Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS with glassmorphism effects
- **Deployment**: Vercel (or any SvelteKit-compatible platform)