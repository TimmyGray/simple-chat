import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_COUNT = 5;
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

interface FileAttachmentProps {
  onAttach: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileAttachment({
  onAttach,
  disabled,
}: FileAttachmentProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const selected = Array.from(files);

    // Validate file count
    if (selected.length > MAX_FILE_COUNT) {
      // eslint-disable-next-line no-restricted-syntax -- F-M21: Replace with MUI Snackbar
      window.alert(t('errors.maxFileCount', { count: MAX_FILE_COUNT }));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of selected) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(t('errors.fileTooLarge', { name: file.name }));
        continue;
      }

      // Validate MIME type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(
          t('errors.unsupportedType', { name: file.name, type: file.type || 'unknown' }),
        );
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      // eslint-disable-next-line no-restricted-syntax -- F-M21: Replace with MUI Snackbar
      window.alert(`${t('errors.filesNotAttached')}\n\n${errors.join('\n')}`);
    }

    if (validFiles.length > 0) {
      onAttach(validFiles);
    }

    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      {/* eslint-disable-next-line no-restricted-syntax -- hidden file input has no MUI equivalent */}
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileChange}
      />
      <Tooltip title={t('chat.attachFiles')}>
        <IconButton
          size="small"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          sx={{ color: 'text.secondary' }}
        >
          <AttachFileIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}
