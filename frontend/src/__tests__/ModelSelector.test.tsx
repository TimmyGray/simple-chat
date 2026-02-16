import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import ModelSelector from '../components/Chat/ModelSelector';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const mockModels = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    description: 'Fast and capable',
    free: true,
    contextLength: 1000000,
    supportsVision: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    description: 'GPT-4 level',
    free: true,
    contextLength: 131072,
    supportsVision: false,
  },
  {
    id: 'openrouter/auto',
    name: 'Auto (Smart Routing)',
    description: 'Picks best model',
    free: false,
    contextLength: 128000,
    supportsVision: true,
  },
];

describe('ModelSelector', () => {
  it('renders with selected value', () => {
    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value="openrouter/free"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Free Models Router')).toBeInTheDocument();
  });

  it('shows model options when clicked', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value="openrouter/free"
        onChange={vi.fn()}
      />,
    );

    // Click the select to open dropdown
    const select = screen.getByRole('combobox');
    await user.click(select);

    expect(screen.getByText('Llama 3.3 70B')).toBeInTheDocument();
    expect(screen.getByText('Auto (Smart Routing)')).toBeInTheDocument();
  });

  it('shows Free chip for free models', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value="openrouter/free"
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox'));

    const freeChips = screen.getAllByText('Free');
    expect(freeChips.length).toBeGreaterThan(0);
  });

  it('calls onChange when a model is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value="openrouter/free"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Llama 3.3 70B'));

    expect(onChange).toHaveBeenCalledWith(
      'meta-llama/llama-3.3-70b-instruct:free',
    );
  });
});
