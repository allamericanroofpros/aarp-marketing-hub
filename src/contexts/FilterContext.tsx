import React, { createContext, useContext, useState, useMemo } from 'react';
import { subDays, startOfMonth, startOfQuarter, startOfYear, format } from 'date-fns';

export type DatePreset = 'last7' | 'last30' | 'mtd' | 'qtd' | 'ytd' | 'custom';

interface FilterState {
  datePreset: DatePreset;
  customStart: string;
  customEnd: string;
  locations: string[];
  sources: string[];
  reps: string[];
  tvMode: boolean;
  startDate: string;
  endDate: string;
  setDatePreset: (p: DatePreset) => void;
  setCustomRange: (start: string, end: string) => void;
  setLocations: (l: string[]) => void;
  setSources: (s: string[]) => void;
  setReps: (r: string[]) => void;
  setTvMode: (v: boolean) => void;
}

const FilterContext = createContext<FilterState>(null!);
export function useFilter() { return useContext(FilterContext); }

const TODAY = new Date('2026-02-23');
const TODAY_STR = '2026-02-23';

function getDateRange(preset: DatePreset, cs: string, ce: string) {
  switch (preset) {
    case 'last7': return { start: format(subDays(TODAY, 7), 'yyyy-MM-dd'), end: TODAY_STR };
    case 'last30': return { start: format(subDays(TODAY, 30), 'yyyy-MM-dd'), end: TODAY_STR };
    case 'mtd': return { start: format(startOfMonth(TODAY), 'yyyy-MM-dd'), end: TODAY_STR };
    case 'qtd': return { start: format(startOfQuarter(TODAY), 'yyyy-MM-dd'), end: TODAY_STR };
    case 'ytd': return { start: format(startOfYear(TODAY), 'yyyy-MM-dd'), end: TODAY_STR };
    case 'custom': return { start: cs || TODAY_STR, end: ce || TODAY_STR };
  }
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [datePreset, setDatePreset] = useState<DatePreset>('last30');
  const [customStart, setCustomStart] = useState(TODAY_STR);
  const [customEnd, setCustomEnd] = useState(TODAY_STR);
  const [locations, setLocations] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [reps, setReps] = useState<string[]>([]);
  const [tvMode, setTvMode] = useState(false);

  const { start, end } = useMemo(() => getDateRange(datePreset, customStart, customEnd), [datePreset, customStart, customEnd]);

  return (
    <FilterContext.Provider value={{
      datePreset, customStart, customEnd, locations, sources, reps, tvMode,
      startDate: start, endDate: end,
      setDatePreset,
      setCustomRange: (s, e) => { setCustomStart(s); setCustomEnd(e); setDatePreset('custom'); },
      setLocations, setSources, setReps, setTvMode,
    }}>
      {children}
    </FilterContext.Provider>
  );
}
