import { useTranslation } from 'react-i18next';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import { alpha } from '@mui/material/styles';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'zh-CN', label: '中文' },
  { code: 'es', label: 'ES' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <ToggleButtonGroup
      value={i18n.language}
      exclusive
      onChange={(_, lang) => {
        if (lang) void i18n.changeLanguage(lang);
      }}
      size="small"
      sx={{
        display: 'flex',
        '& .MuiToggleButton-root': {
          flex: 1,
          py: 0.5,
          fontSize: '0.7rem',
          color: 'text.secondary',
          borderColor: 'divider',
          '&.Mui-selected': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
            color: 'primary.main',
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.25),
            },
          },
        },
      }}
    >
      {languages.map(({ code, label }) => (
        <ToggleButton key={code} value={code}>
          {label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
