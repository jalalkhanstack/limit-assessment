import type { SubmissionListFilters } from '@/lib/types';

/**
 * Maps list filter state to GET /submissions/ query parameters (camelCase keys).
 */
export function buildSubmissionListParams(
  filters: SubmissionListFilters,
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};

  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.brokerId) params.brokerId = filters.brokerId;
  if (filters.companySearch) params.companySearch = filters.companySearch;
  if (filters.createdFrom) params.createdFrom = filters.createdFrom;
  if (filters.createdTo) params.createdTo = filters.createdTo;
  if (filters.hasDocuments !== undefined) params.hasDocuments = filters.hasDocuments;
  if (filters.hasNotes !== undefined) params.hasNotes = filters.hasNotes;
  if (filters.page && filters.page > 1) params.page = filters.page;

  return params;
}
