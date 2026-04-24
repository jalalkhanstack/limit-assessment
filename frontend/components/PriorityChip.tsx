import { Chip } from '@mui/material';

import { SubmissionPriority } from '@/lib/types';

const PRIORITY_META: Record<
  SubmissionPriority,
  { label: string; color: 'default' | 'error' | 'warning' | 'success' }
> = {
  high: { label: 'High', color: 'error' },
  medium: { label: 'Medium', color: 'warning' },
  low: { label: 'Low', color: 'default' },
};

interface Props {
  priority: SubmissionPriority;
}

export default function PriorityChip({ priority }: Props) {
  const { label, color } = PRIORITY_META[priority] ?? { label: priority, color: 'default' };
  return <Chip label={label} color={color} size="small" variant="outlined" />;
}
