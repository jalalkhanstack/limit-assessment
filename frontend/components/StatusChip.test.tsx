import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import StatusChip from '@/components/StatusChip';

const theme = createTheme();

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('StatusChip', () => {
  it('renders human-readable labels', () => {
    renderWithTheme(<StatusChip status="in_review" />);
    expect(screen.getByText('In Review')).toBeInTheDocument();
  });

  it('covers all known statuses', () => {
    const cases: Array<{ status: 'new' | 'in_review' | 'closed' | 'lost'; label: string }> = [
      { status: 'new', label: 'New' },
      { status: 'closed', label: 'Closed' },
      { status: 'lost', label: 'Lost' },
    ];
    for (const { status, label } of cases) {
      const { unmount } = renderWithTheme(<StatusChip status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
