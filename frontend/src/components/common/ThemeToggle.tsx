import { useTranslation } from 'react-i18next';
import { ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useThemeModeContext } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../hooks/useThemeMode';

const modes: { value: ThemeMode; icon: typeof LightModeIcon; labelKey: string }[] = [
  { value: 'light', icon: LightModeIcon, labelKey: 'theme.light' },
  { value: 'dark', icon: DarkModeIcon, labelKey: 'theme.dark' },
  { value: 'system', icon: SettingsBrightnessIcon, labelKey: 'theme.system' },
];

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { mode, setMode } = useThemeModeContext();

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={(_, value: ThemeMode | null) => {
        if (value) setMode(value);
      }}
      size="small"
      aria-label={t('theme.label')}
      sx={{
        display: 'flex',
        '& .MuiToggleButton-root': {
          flex: 1,
          py: 0.5,
          color: 'text.secondary',
          borderColor: 'divider',
          '&.Mui-selected': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
            color: 'primary.light',
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.25),
            },
          },
        },
      }}
    >
      {modes.map(({ value, icon: Icon, labelKey }) => (
        <Tooltip key={value} title={t(labelKey)}>
          <ToggleButton value={value} aria-label={t(labelKey)}>
            <Icon sx={{ fontSize: 16 }} />
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
