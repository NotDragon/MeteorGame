import type { Actions, PageServerLoad } from './$types';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { dev } from '$app/environment';

interface MeteorEntry {
	id: number;
	name: string;
	meteorsCount: number;
	timeMinutes: number;
	ratePerHour: number;
	timestamp: string;
}

interface SupabaseEntry {   
	id: number;
	name: string;
	meteors_count: number;
	time_minutes: number;
	rate_per_hour: number;
	timestamp: string;
}

// Initialize Supabase client
const supabase = dev && (!SUPABASE_URL || !SUPABASE_ANON_KEY)
	? null
	: createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// In-memory storage for development without Supabase
let devEntries: MeteorEntry[] = [];

function toMeteorEntry(entry: SupabaseEntry): MeteorEntry {
	return {
		id: entry.id,
		name: entry.name,
		meteorsCount: entry.meteors_count,
		timeMinutes: entry.time_minutes,
		ratePerHour: entry.rate_per_hour,
		timestamp: entry.timestamp
	};
}

function toSupabaseEntry(entry: Omit<MeteorEntry, 'id'>): Omit<SupabaseEntry, 'id'> {
	return {
		name: entry.name,
		meteors_count: entry.meteorsCount,
		time_minutes: entry.timeMinutes,
		rate_per_hour: entry.ratePerHour,
		timestamp: entry.timestamp
	};
}

async function readEntries(): Promise<MeteorEntry[]> {
	try {
		if (!supabase) {
			// Use in-memory storage if Supabase is not configured
			console.log('Using in-memory storage (Supabase not configured)');
			return devEntries;
		}
		
		const { data, error } = await supabase
			.from('meteor_entries')
			.select('*')
			.order('rate_per_hour', { ascending: false });
		
		if (error) {
			console.error('Error reading entries from Supabase:', error);
			return [];
		}
		
		return (data || []).map(toMeteorEntry);
	} catch (error) {
		console.error('Error reading entries:', error);
		return [];
	}
}

async function saveEntry(entry: Omit<MeteorEntry, 'id'>): Promise<MeteorEntry | null> {
	try {
		if (!supabase) {
			// Use in-memory storage if Supabase is not configured
			const newEntry: MeteorEntry = {
				...entry,
				id: devEntries.length > 0 ? Math.max(...devEntries.map(e => e.id)) + 1 : 1
			};
			devEntries = [...devEntries, newEntry];
			return newEntry;
		}
		
		const { data, error } = await supabase
			.from('meteor_entries')
			.insert(toSupabaseEntry(entry))
			.select()
			.single();
		
		if (error) {
			console.error('Error saving entry to Supabase:', error);
			return null;
		}
		
		return data ? toMeteorEntry(data) : null;
	} catch (error) {
		console.error('Error saving entry:', error);
		return null;
	}
}

export const load: PageServerLoad = async () => {
	const entries = await readEntries();
	return {
		entries
	};
};

export const actions: Actions = {
	addEntry: async ({ request }) => {
		const formData = await request.formData();
		
		const name = formData.get('name') as string;
		const meteorsCount = parseInt(formData.get('meteorsCount') as string);
		const timeMinutes = parseFloat(formData.get('timeMinutes') as string);
		
		if (!name || !meteorsCount || !timeMinutes || timeMinutes <= 0) {
			return {
				success: false,
				error: 'Invalid form data'
			};
		}
		
		const ratePerHour = (meteorsCount / timeMinutes) * 60;
		
		const newEntry = await saveEntry({
			name,
			meteorsCount,
			timeMinutes,
			ratePerHour,
			timestamp: new Date().toISOString()
		});
		
		if (!newEntry) {
			return {
				success: false,
				error: 'Failed to save entry'
			};
		}
		
		return {
			success: true,
			entry: newEntry
		};
	}
};