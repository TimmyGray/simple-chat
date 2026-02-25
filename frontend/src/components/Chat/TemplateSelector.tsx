import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListSubheader,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import type { Template, TemplateId } from '../../types';
import { TEMPLATE_MENU_MAX_HEIGHT, TEMPLATE_CONTENT_PREVIEW_LENGTH } from '../../constants';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplateId: TemplateId | null;
  onChange: (templateId: TemplateId | null) => void;
  disabled?: boolean;
}

export default function TemplateSelector({
  templates,
  selectedTemplateId,
  onChange,
  disabled,
}: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (templateId: TemplateId | null) => {
    onChange(templateId);
    handleClose();
  };

  const categories = groupByCategory(templates);
  const hasSelection = selectedTemplateId !== null;

  return (
    <>
      <Tooltip title={t('templates.selectTemplate')}>
        <span>
          <IconButton
            aria-label={t('templates.selectTemplate')}
            onClick={handleOpen}
            disabled={disabled}
            size="small"
            sx={{
              color: hasSelection ? 'primary.main' : 'text.secondary',
            }}
          >
            <DescriptionOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: { maxHeight: TEMPLATE_MENU_MAX_HEIGHT, minWidth: 240 },
          },
        }}
      >
        <MenuItem
          selected={!hasSelection}
          onClick={() => handleSelect(null)}
        >
          <ListItemText
            primary={t('templates.none')}
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </MenuItem>
        {categories.map(({ category, items }) => [
          <ListSubheader key={category} sx={{ lineHeight: '32px' }}>
            {category}
          </ListSubheader>,
          ...items.map((tmpl) => (
            <MenuItem
              key={tmpl._id}
              selected={tmpl._id === selectedTemplateId}
              onClick={() => handleSelect(tmpl._id)}
            >
              <ListItemText
                primary={tmpl.name}
                secondary={
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      component="span"
                      sx={{ display: 'block', maxWidth: 220 }}
                    >
                      {truncate(tmpl.content, TEMPLATE_CONTENT_PREVIEW_LENGTH)}
                    </Typography>
                  </Box>
                }
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  );
}

function groupByCategory(templates: Template[]): { category: string; items: Template[] }[] {
  const map = new Map<string, Template[]>();
  for (const t of templates) {
    const existing = map.get(t.category);
    if (existing) {
      existing.push(t);
    } else {
      map.set(t.category, [t]);
    }
  }
  return Array.from(map, ([category, items]) => ({ category, items }));
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}
