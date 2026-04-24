'use client';

import { useMemo } from 'react';
import { QueryKey, keepPreviousData, useQuery } from '@tanstack/react-query';

import { buildSubmissionListParams } from '@/lib/buildSubmissionListParams';
import { apiClient } from '@/lib/api-client';
import {
  PaginatedResponse,
  SubmissionDetail,
  SubmissionListFilters,
  SubmissionListItem,
} from '@/lib/types';

const SUBMISSIONS_QUERY_KEY = 'submissions';

async function fetchSubmissions(filters: SubmissionListFilters) {
  const params = buildSubmissionListParams(filters);

  const response = await apiClient.get<PaginatedResponse<SubmissionListItem>>('/submissions/', {
    params,
  });
  return response.data;
}

async function fetchSubmissionDetail(id: string | number) {
  if (!id) throw new Error('Submission id is required');
  const response = await apiClient.get<SubmissionDetail>(`/submissions/${id}/`);
  return response.data;
}

export function useSubmissionsList(filters: SubmissionListFilters) {
  return useQuery({
    queryKey: [SUBMISSIONS_QUERY_KEY, filters] as QueryKey,
    queryFn: () => fetchSubmissions(filters),
    enabled: true,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useSubmissionDetail(id: string | number) {
  return useQuery({
    queryKey: [SUBMISSIONS_QUERY_KEY, id],
    queryFn: () => fetchSubmissionDetail(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useSubmissionQueryKey(filters: SubmissionListFilters) {
  return useMemo(() => [SUBMISSIONS_QUERY_KEY, filters] as QueryKey, [filters]);
}
