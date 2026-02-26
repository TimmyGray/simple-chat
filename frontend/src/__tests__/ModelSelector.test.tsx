import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { asModelId } from '../types';
import ModelSelector from '../components/Chat/ModelSelector';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const mockModels = [
  {
    id: asModelId('ollama/llama3:latest'),
    name: 'llama3:latest 8B',
    description: 'Local model (llama, Q4_0)',
    free: true,
    contextLength: 0,
    supportsVision: false,
    provider: 'ollama' as const,
  },
  {
    id: asModelId('openrouter/free'),
    name: 'Free Models Router',
    description: 'Fast and capable',
    free: true,
    contextLength: 1000000,
    supportsVision: true,
    provider: 'openrouter' as const,
  },
  {
    id: asModelId('meta-llama/llama-3.3-70b-instruct:free'),
    name: 'Llama 3.3 70B',
    description: 'GPT-4 level',
    free: true,
    contextLength: 131072,
    supportsVision: false,
    provider: 'openrouter' as const,
  },
  {
    id: asModelId('openrouter/auto'),
    name: 'Auto (Smart Routing)',
    description: 'Picks best model',
    free: false,
    contextLength: 128000,
    supportsVision: true,
    provider: 'openrouter' as const,
  },
];

describe('ModelSelector', () => {
  it('renders with selected value', () => {
    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value={asModelId('openrouter/free')}
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
        value={asModelId('openrouter/free')}
        onChange={vi.fn()}
      />,
    );

    // Click the select to open dropdown
    const select = screen.getByRole('combobox');
    await user.click(select);

    expect(screen.getByText('Llama 3.3 70B')).toBeInTheDocument();
    expect(screen.getByText('Auto (Smart Routing)')).toBeInTheDocument();
  });

  it('shows Free chip for free OpenRouter models', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value={asModelId('openrouter/free')}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox'));

    const freeChips = screen.getAllByText('Free');
    expect(freeChips.length).toBeGreaterThan(0);
  });

  it('shows Local chip for Ollama models', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value={asModelId('openrouter/free')}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox'));

    const localChips = screen.getAllByText('Local');
    expect(localChips).toHaveLength(1);
  });

  it('does not show Free chip for Ollama models', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value={asModelId('ollama/llama3:latest')}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('combobox'));

    // Local chips: 1 in selected display + 1 in dropdown = 2
    const localChips = screen.getAllByText('Local');
    expect(localChips).toHaveLength(2);

    // Free chips should NOT include Ollama models (they show Local instead)
    const freeChips = screen.getAllByText('Free');
    // Only OpenRouter free models should have Free chip
    expect(freeChips.length).toBe(2); // Free Models Router + Llama 3.3 70B
  });

  it('calls onChange when a model is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithTheme(
      <ModelSelector
        models={mockModels}
        value={asModelId('openrouter/free')}
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
