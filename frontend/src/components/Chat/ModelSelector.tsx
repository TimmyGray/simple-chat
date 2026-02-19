import { useTranslation } from 'react-i18next';
import { FormControl, Select, MenuItem, Chip } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { ModelInfo } from '../../types';

interface ModelSelectorProps {
  models: ModelInfo[];
  value: string;
  onChange: (modelId: string) => void;
  size?: 'small' | 'medium';
}

export default function ModelSelector({
  models,
  value,
  onChange,
  size = 'small',
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const handleChange = (e: SelectChangeEvent) => onChange(e.target.value);

  return (
    <FormControl size={size} sx={{ minWidth: 140 }}>
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        sx={{
          borderRadius: 2,
          backgroundColor: 'transparent',
          '& .MuiSelect-select': {
            py: 0.5,
            fontSize: '0.8rem',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.16)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
            borderWidth: 1,
          },
        }}
      >
        {models.map((model) => (
          <MenuItem key={model.id} value={model.id} sx={{ fontSize: '0.85rem' }}>
            {model.name}
            {model.free && (
              <Chip
                label={t('models.free')}
                size="small"
                color="success"
                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
              />
            )}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
