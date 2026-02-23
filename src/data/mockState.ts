import type { MockData } from './types';
import { generateMockData } from './mockGenerator';

const STORAGE_KEY = 'aarp-marketing-os-data-v2';
let cached: MockData | null = null;

export function getMockData(): MockData {
  if (cached) return cached;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate new fields exist
      if (parsed.contacts && parsed.sessions && parsed.events && parsed.videos && parsed.videoEvents) {
        cached = parsed;
        return cached!;
      }
    } catch { /* regenerate */ }
  }
  cached = generateMockData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  return cached;
}

export function updateMockData(data: MockData): void {
  cached = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetMockData(): MockData {
  localStorage.removeItem(STORAGE_KEY);
  // Also remove old key
  localStorage.removeItem('aarp-marketing-os-data');
  cached = null;
  return getMockData();
}
