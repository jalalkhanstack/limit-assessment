'use client';

import { type ChangeEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Chip,
  Container,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useBrokerOptions } from '@/lib/hooks/useBrokerOptions';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useSubmissionsList } from '@/lib/hooks/useSubmissions';
import { type Broker, type SubmissionListItem, SubmissionStatus } from '@/lib/types';
import PriorityChip from '@/components/PriorityChip';
import StatusChip from '@/components/StatusChip';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { label: string; value: SubmissionStatus | '' }[] = [
  { label: 'All statuses', value: '' },
  { label: 'New', value: 'new' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Closed', value: 'closed' },
  { label: 'Lost', value: 'lost' },
];

const COLUMNS = [
  { id: 'company', label: 'Company', align: 'left' as const, width: 220 },
  { id: 'status', label: 'Status', align: 'left' as const, width: 110 },
  { id: 'priority', label: 'Priority', align: 'left' as const, width: 100 },
  { id: 'broker', label: 'Broker', align: 'left' as const, width: 160 },
  { id: 'owner', label: 'Owner', align: 'left' as const, width: 140 },
  { id: 'docs', label: 'Docs', align: 'center' as const, width: 60 },
  { id: 'notes', label: 'Notes', align: 'center' as const, width: 60 },
  { id: 'created', label: 'Created', align: 'left' as const, width: 120 },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SubmissionsPage() {
  const router = useRouter();

  const [status, setStatus] = useState<SubmissionStatus | ''>('');
  const [brokerId, setBrokerId] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [page, setPage] = useState(1);

  const companySearch = useDebounce(companyInput, 350);

  const handleStatus = (val: SubmissionStatus | '') => { setStatus(val); setPage(1); };
  const handleBroker = (val: string) => { setBrokerId(val); setPage(1); };
  const handleCompany = (val: string) => { setCompanyInput(val); setPage(1); };
  const clearFilters = () => { setStatus(''); setBrokerId(''); setCompanyInput(''); setPage(1); };

  const hasActiveFilters = !!(status || brokerId || companyInput);

  const filters = useMemo(
    () => ({
      status: status || undefined,
      brokerId: brokerId || undefined,
      companySearch: companySearch || undefined,
      page,
    }),
    [status, brokerId, companySearch, page],
  );

  const { data, isLoading, isError, isFetching } = useSubmissionsList(filters);
  const { data: brokers } = useBrokerOptions();

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>

        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Submissions
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {data
              ? `${data.count} submission${data.count !== 1 ? 's' : ''} found`
              : 'Browse and filter incoming broker submissions'}
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start" flexWrap="wrap">
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleStatus(e.target.value as SubmissionStatus | '')}
              size="small"
              sx={{ minWidth: 160 }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Broker"
              value={brokerId}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleBroker(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All brokers</MenuItem>
              {brokers?.map((b: Broker) => (
                <MenuItem key={b.id} value={String(b.id)}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Company"
              value={companyInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleCompany(e.target.value)}
              size="small"
              placeholder="Search by name…"
              sx={{ minWidth: 220 }}
            />

            {hasActiveFilters && (
              <Tooltip title="Clear all filters">
                <Chip
                  label="Clear filters"
                  onClick={clearFilters}
                  onDelete={clearFilters}
                  size="small"
                  variant="outlined"
                  sx={{ alignSelf: 'center' }}
                />
              </Tooltip>
            )}
          </Stack>
        </Paper>

        {isError && (
          <Alert severity="error" variant="outlined">
            Could not load submissions — please ensure the Django server is running on port 8000
            and the database has been seeded with{' '}
            <code>python manage.py seed_submissions</code>.
          </Alert>
        )}

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            opacity: isFetching && !isLoading ? 0.65 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {COLUMNS.map((col) => (
                  <TableCell
                    key={col.id}
                    align={col.align}
                    sx={{ fontWeight: 700, width: col.width, py: 1.5, whiteSpace: 'nowrap' }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }, (_, i) => (
                  <TableRow key={i}>
                    {COLUMNS.map((col) => (
                      <TableCell key={col.id} align={col.align}>
                        <Skeleton
                          variant="text"
                          width={col.align === 'center' ? 28 : '75%'}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading &&
                data?.results.map((submission: SubmissionListItem) => (
                  <TableRow
                    key={submission.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/submissions/${submission.id}`)}
                  >
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {submission.company.legalName}
                      </Typography>
                      {(submission.company.industry || submission.company.headquartersCity) && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {[submission.company.industry, submission.company.headquartersCity]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusChip status={submission.status} />
                    </TableCell>

                    <TableCell>
                      <PriorityChip priority={submission.priority} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{submission.broker.name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{submission.owner.fullName}</Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        color={submission.documentCount > 0 ? 'text.primary' : 'text.disabled'}
                        fontWeight={submission.documentCount > 0 ? 600 : 400}
                      >
                        {submission.documentCount}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        color={submission.noteCount > 0 ? 'text.primary' : 'text.disabled'}
                        fontWeight={submission.noteCount > 0 ? 600 : 400}
                      >
                        {submission.noteCount}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(submission.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!isLoading && !isError && data?.results.length === 0 && (
          <Box
            sx={{
              py: 10,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No submissions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters.'
                : 'No submissions have been created yet. Run the seed command to populate sample data.'}
            </Typography>
            {hasActiveFilters && (
              <Box mt={2}>
                <Chip label="Clear filters" onClick={clearFilters} variant="outlined" />
              </Box>
            )}
          </Box>
        )}

        {!isLoading && totalPages > 1 && (
          <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages}
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_: unknown, value: number) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}

      </Stack>
    </Container>
  );
}
