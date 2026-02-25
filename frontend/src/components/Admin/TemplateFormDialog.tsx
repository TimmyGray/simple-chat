import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Template, CreateTemplateDto } from '../../types';
import { AUTH_SUBMIT_SPINNER_SIZE } from '../../constants';

interface TemplateFormDialogProps {
  open: boolean;
  template: Template | null;
  onSave: (dto: CreateTemplateDto) => Promise<boolean>;
  onCancel: () => void;
}

export default function TemplateFormDialog({
  open,
  template,
  onSave,
  onCancel,
}: TemplateFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(template?.name ?? '');
  const [content, setContent] = useState(template?.content ?? '');
  const [category, setCategory] = useState(template?.category ?? '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [contentError, setContentError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError(t('templates.nameRequired'));
      valid = false;
    } else {
      setNameError('');
    }
    if (!content.trim()) {
      setContentError(t('templates.contentRequired'));
      valid = false;
    } else {
      setContentError('');
    }
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const success = await onSave({
        name: name.trim(),
        content: content.trim(),
        ...(category.trim() ? { category: category.trim() } : {}),
      });
      if (success) {
        onCancel();
      }
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!template;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? t('templates.editTitle') : t('templates.createTitle')}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <TextField
          label={t('templates.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!nameError}
          helperText={nameError}
          fullWidth
          size="small"
          autoFocus
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <TextField
          label={t('templates.category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ htmlInput: { maxLength: 50 } }}
        />
        <TextField
          label={t('templates.content')}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          error={!!contentError}
          helperText={contentError}
          fullWidth
          multiline
          minRows={4}
          maxRows={12}
          slotProps={{ htmlInput: { maxLength: 10000 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit" disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={AUTH_SUBMIT_SPINNER_SIZE} color="inherit" /> : undefined}
        >
          {t('templates.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
