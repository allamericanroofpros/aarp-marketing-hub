import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Filters } from '@/api/client';

export function useHomeData(f: Filters) {
  return useQuery({ queryKey: ['homeData', f.startDate, f.endDate, f.locations], queryFn: () => api.getHomeData(f), retry: 2 });
}
export function useRollupBySource(f: Filters) {
  return useQuery({ queryKey: ['rollupBySource', f.startDate, f.endDate, f.locations], queryFn: () => api.getRollupBySource(f), retry: 2 });
}
export function useRollupByRep(f: Filters) {
  return useQuery({ queryKey: ['rollupByRep', f.startDate, f.endDate, f.locations], queryFn: () => api.getRollupByRep(f), retry: 2 });
}
export function useLeads(f: Filters) {
  return useQuery({ queryKey: ['leads', f.startDate, f.endDate, f.locations, f.sourceFilter, f.repFilter, f.statusFilter], queryFn: () => api.getLeads(f), retry: 2 });
}
export function useDeals(f: Filters) {
  return useQuery({ queryKey: ['deals', f.startDate, f.endDate, f.locations, f.sourceFilter, f.repFilter, f.statusFilter], queryFn: () => api.getDeals(f), retry: 2 });
}
export function useContactTimeline(contactId: string | null) {
  return useQuery({ queryKey: ['timeline', contactId], queryFn: () => api.getContactTimeline(contactId!), enabled: !!contactId, retry: 2 });
}
export function useAnalyticsKPIs(f: Filters) {
  return useQuery({ queryKey: ['analyticsKPIs', f.startDate, f.endDate, f.locations], queryFn: () => api.getAnalyticsKPIs(f), retry: 2 });
}
export function useFunnel(f: Filters) {
  return useQuery({ queryKey: ['funnel', f.startDate, f.endDate, f.locations], queryFn: () => api.getFunnel(f), retry: 2 });
}
export function useTopPages(f: Filters) {
  return useQuery({ queryKey: ['topPages', f.startDate, f.endDate, f.locations], queryFn: () => api.getTopPages(f), retry: 2 });
}
export function useUTMPerformance(f: Filters) {
  return useQuery({ queryKey: ['utmPerf', f.startDate, f.endDate, f.locations], queryFn: () => api.getUTMPerformance(f), retry: 2 });
}
export function useVideoLeaderboard(f: { startDate: string; endDate: string }) {
  return useQuery({ queryKey: ['videoLeaderboard', f.startDate, f.endDate], queryFn: () => api.getVideoLeaderboard(f), retry: 2 });
}
export function useVideoAttrition(videoId?: string) {
  return useQuery({ queryKey: ['videoAttrition', videoId], queryFn: () => api.getVideoAttrition(videoId), retry: 2 });
}
export function useInfluencedConversions(limit?: number) {
  return useQuery({ queryKey: ['influenced', limit], queryFn: () => api.getInfluencedConversions(limit), retry: 2 });
}
export function useContentAssets() {
  return useQuery({ queryKey: ['contentAssets'], queryFn: () => api.getContentAssets(), retry: 2 });
}
export function useWebAgendas() {
  return useQuery({ queryKey: ['webAgendas'], queryFn: () => api.getWebAgendas(), retry: 2 });
}
export function useScorecards() {
  return useQuery({ queryKey: ['scorecards'], queryFn: () => api.getScorecards(), retry: 2 });
}
export function useConnectors() {
  return useQuery({ queryKey: ['connectors'], queryFn: () => api.getConnectors(), retry: 2 });
}
export function useSyncLogs(connectorId?: string) {
  return useQuery({ queryKey: ['syncLogs', connectorId], queryFn: () => api.getSyncLogs(connectorId), retry: 2, enabled: !!connectorId });
}
export function useSources() {
  return useQuery({ queryKey: ['sources'], queryFn: () => api.getSources(), retry: 2 });
}
export function useReps() {
  return useQuery({ queryKey: ['reps'], queryFn: () => api.getReps(), retry: 2 });
}
export function useMappingRules() {
  return useQuery({ queryKey: ['mappingRules'], queryFn: () => api.getMappingRules(), retry: 2 });
}
export function useUnmappedLeads(f: Filters) {
  return useQuery({ queryKey: ['unmappedLeads', f.startDate, f.endDate], queryFn: () => api.getUnmappedLeads(f), retry: 2 });
}
export function useUnmappedSpend(f: Filters) {
  return useQuery({ queryKey: ['unmappedSpend', f.startDate, f.endDate], queryFn: () => api.getUnmappedSpend(f), retry: 2 });
}
export function useUnmappedSessions(f: Filters) {
  return useQuery({ queryKey: ['unmappedSessions', f.startDate, f.endDate], queryFn: () => api.getUnmappedSessions(f), retry: 2 });
}
export function useAssistantContext(f: Filters) {
  return useQuery({ queryKey: ['assistantCtx', f.startDate, f.endDate, f.locations], queryFn: () => api.getAssistantContext(f), retry: 2 });
}
export function useSystemHealth() {
  return useQuery({ queryKey: ['systemHealth'], queryFn: () => api.getSystemHealth(), retry: 2, refetchInterval: 5000 });
}
export function useCreateMappingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: any) => api.createMappingRule(rule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mappingRules'] });
      qc.invalidateQueries({ queryKey: ['unmappedLeads'] });
      qc.invalidateQueries({ queryKey: ['unmappedSpend'] });
      qc.invalidateQueries({ queryKey: ['unmappedSessions'] });
    },
  });
}
export function useRunConnectorSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectorId: string) => api.runConnectorSync(connectorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connectors'] });
      qc.invalidateQueries({ queryKey: ['syncLogs'] });
    },
  });
}
export function useResetData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetData(),
    onSuccess: () => qc.invalidateQueries(),
  });
}
