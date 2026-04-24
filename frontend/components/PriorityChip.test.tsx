import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import PriorityChip from '@/components/PriorityChip';

const theme = createTheme();

function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PriorityChip', () => {
  it('renders priority labels', () => {
    renderWithTheme(<PriorityChip priority="high" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders medium and low', () => {
    const { rerender } = renderWithTheme(<PriorityChip priority="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
    rerender(
      <ThemeProvider theme={theme}>
        <PriorityChip priority="low" />
      </ThemeProvider>,
    );
    expect(screen.getByText('Low')).toBeInTheDocument();
  });
});
