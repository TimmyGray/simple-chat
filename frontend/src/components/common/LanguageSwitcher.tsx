import { useTranslation } from 'react-i18next';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

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
        if (lang) i18n.changeLanguage(lang);
      }}
      size="small"
      sx={{
        display: 'flex',
        '& .MuiToggleButton-root': {
          flex: 1,
          py: 0.5,
          fontSize: '0.7rem',
          color: 'text.secondary',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          '&.Mui-selected': {
            backgroundColor: 'rgba(124, 77, 255, 0.15)',
            color: 'primary.light',
            '&:hover': {
              backgroundColor: 'rgba(124, 77, 255, 0.25)',
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
