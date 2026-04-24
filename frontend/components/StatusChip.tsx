import { Chip } from '@mui/material';

import { SubmissionStatus } from '@/lib/types';

const STATUS_META: Record<
  SubmissionStatus,
  { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }
> = {
  new: { label: 'New', color: 'info' },
  in_review: { label: 'In Review', color: 'warning' },
  closed: { label: 'Closed', color: 'success' },
  lost: { label: 'Lost', color: 'default' },
};

interface Props {
  status: SubmissionStatus;
}

export default function StatusChip({ status }: Props) {
  const { label, color } = STATUS_META[status] ?? { label: status, color: 'default' };
  return <Chip label={label} color={color} size="small" />;
}
