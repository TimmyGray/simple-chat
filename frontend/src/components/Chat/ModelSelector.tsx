import { useTranslation } from 'react-i18next';
import { FormControl, Select, MenuItem, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material';
import type { ModelInfo, ModelId } from '../../types';
import {
  MODEL_SELECTOR_MIN_WIDTH,
  FREE_CHIP_HEIGHT,
  SELECT_FONT_SIZE,
  MODEL_MENU_FONT_SIZE,
  FREE_CHIP_FONT_SIZE,
  LOCAL_CHIP_HEIGHT,
  LOCAL_CHIP_FONT_SIZE,
} from '../../constants';

interface ModelSelectorProps {
  models: ModelInfo[];
  value: ModelId;
  onChange: (modelId: ModelId) => void;
  size?: 'small' | 'medium';
}

export default function ModelSelector({
  models,
  value,
  onChange,
  size = 'small',
}: ModelSelectorProps) {
  const { t } = useTranslation();
  const handleChange = (e: SelectChangeEvent) => onChange(e.target.value as ModelId);

  return (
    <FormControl size={size} sx={{ minWidth: MODEL_SELECTOR_MIN_WIDTH }}>
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        inputProps={{ 'aria-label': t('models.selectModel') }}
        sx={{
          borderRadius: 2,
          backgroundColor: 'transparent',
          '& .MuiSelect-select': {
            py: 0.5,
            fontSize: SELECT_FONT_SIZE,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'divider',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (theme) => alpha(theme.palette.text.primary, 0.16),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
            borderWidth: 1,
          },
        }}
      >
        {models.map((model) => (
          <MenuItem key={model.id} value={model.id} sx={{ fontSize: MODEL_MENU_FONT_SIZE }}>
            {model.name}
            {model.provider === 'ollama' && (
              <Chip
                label={t('models.local')}
                size="small"
                color="info"
                sx={{ ml: 1, height: LOCAL_CHIP_HEIGHT, fontSize: LOCAL_CHIP_FONT_SIZE }}
              />
            )}
            {model.free && model.provider !== 'ollama' && (
              <Chip
                label={t('models.free')}
                size="small"
                color="success"
                sx={{ ml: 1, height: FREE_CHIP_HEIGHT, fontSize: FREE_CHIP_FONT_SIZE }}
              />
            )}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
