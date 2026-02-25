import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Box,
  CircularProgress,
  Typography,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import type { Template, CreateTemplateDto } from '../../types';
import { useAdminTemplates } from '../../hooks/useAdminTemplates';
import TemplateFormDialog from './TemplateFormDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import { ICON_SIZE_SM, LOADING_SPINNER_LG, ERROR_SNACKBAR_AUTO_HIDE_MS } from '../../constants';

interface AdminTemplatePanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminTemplatePanel({ open, onClose }: AdminTemplatePanelProps) {
  const { t } = useTranslation();
  const { templates, loading, error, clearError, fetchTemplates, create, update, remove } = useAdminTemplates();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);

  useEffect(() => {
    if (open) {
      void fetchTemplates();
    }
  }, [open, fetchTemplates]);

  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((template: Template) => {
    setEditingTemplate(template);
    setFormOpen(true);
  }, []);

  const handleFormSave = useCallback(async (dto: CreateTemplateDto): Promise<boolean> => {
    if (editingTemplate) {
      const result = await update(editingTemplate._id, dto);
      return result !== null;
    }
    const result = await create(dto);
    return result !== null;
  }, [editingTemplate, create, update]);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget) {
      await remove(deleteTarget._id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, remove]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('templates.adminTitle')}
          <IconButton onClick={onClose} size="small" aria-label={t('common.cancel')}>
            <CloseIcon sx={{ fontSize: ICON_SIZE_SM }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
              size="small"
            >
              {t('templates.create')}
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={LOADING_SPINNER_LG} />
            </Box>
          ) : templates.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('templates.noTemplates')}
            </Typography>
          ) : (
            <List disablePadding>
              {templates.map((template) => (
                <TemplateListItem
                  key={template._id}
                  template={template}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <TemplateFormDialog
        key={formOpen ? (editingTemplate?._id ?? 'new') : 'closed'}
        open={formOpen}
        template={editingTemplate}
        onSave={handleFormSave}
        onCancel={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('templates.deleteTitle')}
        message={t('templates.deleteMessage', { name: deleteTarget?.name })}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={ERROR_SNACKBAR_AUTO_HIDE_MS}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

function TemplateListItem({
  template,
  onEdit,
  onDelete,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onDelete: (t: Template) => void;
}) {
  const { t } = useTranslation();

  return (
    <ListItem
      sx={{ borderBottom: 1, borderColor: 'divider', px: 0 }}
      secondaryAction={
        !template.isDefault && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={t('templates.editTitle')}>
              <IconButton
                size="small"
                onClick={() => onEdit(template)}
                aria-label={t('templates.editTitle')}
              >
                <EditOutlinedIcon sx={{ fontSize: ICON_SIZE_SM }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <IconButton
                size="small"
                onClick={() => onDelete(template)}
                aria-label={t('common.delete')}
                color="error"
              >
                <DeleteOutlineIcon sx={{ fontSize: ICON_SIZE_SM }} />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {template.name}
            {template.isDefault && (
              <Chip label={t('templates.defaultBadge')} size="small" variant="outlined" />
            )}
          </Box>
        }
        secondary={template.category}
      />
    </ListItem>
  );
}
