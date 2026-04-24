import { describe, expect, it } from 'vitest';

import { buildSubmissionListParams } from '@/lib/buildSubmissionListParams';

describe('buildSubmissionListParams', () => {
  it('omits empty optional filters', () => {
    expect(buildSubmissionListParams({})).toEqual({});
    expect(buildSubmissionListParams({ page: 1 })).toEqual({});
  });

  it('includes status, broker, company search, and priority when set', () => {
    expect(
      buildSubmissionListParams({
        status: 'in_review',
        brokerId: '3',
        companySearch: 'acme',
        priority: 'high',
      }),
    ).toEqual({
      status: 'in_review',
      brokerId: '3',
      companySearch: 'acme',
      priority: 'high',
    });
  });

  it('includes date range and boolean flags', () => {
    expect(
      buildSubmissionListParams({
        createdFrom: '2024-01-01',
        createdTo: '2024-12-31',
        hasDocuments: true,
        hasNotes: false,
      }),
    ).toEqual({
      createdFrom: '2024-01-01',
      createdTo: '2024-12-31',
      hasDocuments: true,
      hasNotes: false,
    });
  });

  it('includes page only when greater than 1', () => {
    expect(buildSubmissionListParams({ page: 2 })).toEqual({ page: 2 });
    expect(buildSubmissionListParams({ page: 1, status: 'new' })).toEqual({ status: 'new' });
  });
});
