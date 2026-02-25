import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DataObjectIcon from '@mui/icons-material/DataObject';
import { exportConversation, type ExportFormat } from '../../api/client';
import type { ConversationId } from '../../types';
import { getErrorMessage } from '../../utils/getErrorMessage';

interface ExportMenuProps {
  conversationId: ConversationId;
  onError: (message: string) => void;
}

const FORMAT_OPTIONS: { format: ExportFormat; labelKey: string; Icon: typeof DescriptionIcon }[] = [
  { format: 'markdown', labelKey: 'export.markdown', Icon: DescriptionIcon },
  { format: 'pdf', labelKey: 'export.pdf', Icon: PictureAsPdfIcon },
  { format: 'json', labelKey: 'export.json', Icon: DataObjectIcon },
];

export default function ExportMenu({ conversationId, onError }: ExportMenuProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      handleClose();
      setExporting(true);
      try {
        const blob = await exportConversation(conversationId, format);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        onError(getErrorMessage(err, t('errors.exportFailed')));
      } finally {
        setExporting(false);
      }
    },
    [conversationId, handleClose, onError, t],
  );

  return (
    <>
      <Tooltip title={exporting ? t('export.exporting') : t('export.button')}>
        <span>
          <IconButton
            aria-label={t('export.button')}
            onClick={handleOpen}
            disabled={exporting}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            {exporting ? (
              <CircularProgress size={20} />
            ) : (
              <FileDownloadIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {FORMAT_OPTIONS.map(({ format, labelKey, Icon }) => (
          <MenuItem
            key={format}
            onClick={() => void handleExport(format)}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t(labelKey)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
