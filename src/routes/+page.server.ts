import type { Actions, PageServerLoad } from './$types';
import * as fs from 'fs/promises';

interface MeteorEntry {
	id: number;
	name: string;
	meteorsCount: number;
	timeMinutes: number;
	ratePerHour: number;
	timestamp: string;
}

const DATA_FILE = 'meteor-data.json';

async function readEntries(): Promise<MeteorEntry[]> {
	try {
		const data = await fs.readFile(DATA_FILE, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		// If file doesn't exist, return empty array
		return [];
	}
}

async function saveEntries(entries: MeteorEntry[]): Promise<void> {
	await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
}

async function getNextId(entries: MeteorEntry[]): Promise<number> {
	if (entries.length === 0) return 1;
	return Math.max(...entries.map(e => e.id)) + 1;
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
		
		const entries = await readEntries();
		const ratePerHour = (meteorsCount / timeMinutes) * 60;
		
		const newEntry: MeteorEntry = {
			id: await getNextId(entries),
			name,
			meteorsCount,
			timeMinutes,
			ratePerHour,
			timestamp: new Date().toISOString()
		};
		
		entries.push(newEntry);
		await saveEntries(entries);
		
		return {
			success: true,
			entry: newEntry
		};
	}
};