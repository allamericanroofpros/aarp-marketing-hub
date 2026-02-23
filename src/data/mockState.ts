import type { MockData } from './types';
import { generateMockData } from './mockGenerator';

const STORAGE_KEY = 'aarp-marketing-os-data';
let cached: MockData | null = null;

export function getMockData(): MockData {
  if (cached) return cached;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { cached = JSON.parse(stored); return cached!; } catch { /* regenerate */ }
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
  cached = null;
  return getMockData();
}
