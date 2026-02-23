// Stubbed API client — returns mock data for now
// Replace with real fetch calls when backend is ready

import { getMockData } from '@/data/mockState';
import type { MockData } from '@/data/types';

export const api = {
  getData(): MockData {
    return getMockData();
  },

  // Placeholder endpoints for future backend
  async getSessions(_filters: any) {
    const data = getMockData();
    return data.sessions;
  },

  async getEvents(_filters: any) {
    const data = getMockData();
    return data.events;
  },

  async getVideoEvents(_filters: any) {
    const data = getMockData();
    return data.videoEvents;
  },

  async getContacts(_filters: any) {
    const data = getMockData();
    return data.contacts;
  },

  async getLeads(_filters: any) {
    const data = getMockData();
    return data.leads;
  },

  async getDeals(_filters: any) {
    const data = getMockData();
    return data.deals;
  },
};
