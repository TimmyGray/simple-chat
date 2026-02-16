import { useRef } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';

interface FileAttachmentProps {
  onAttach: (files: File[]) => void;
  disabled?: boolean;
}

export default function FileAttachment({
  onAttach,
  disabled,
}: FileAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAttach(Array.from(files));
    }
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileChange}
      />
      <Tooltip title="Attach files">
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
