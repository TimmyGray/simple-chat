import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import type { ConversationId } from '../../types';
import { ICON_SIZE_SM } from '../../constants';
import ShareDialog from './ShareDialog';

interface ShareButtonProps {
  conversationId: ConversationId;
  currentUserId: string;
}

export default function ShareButton({ conversationId, currentUserId }: ShareButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={t('sharing.share')}>
        <IconButton
          size="small"
          aria-label={t('sharing.share')}
          onClick={() => setOpen(true)}
          sx={{ color: 'text.secondary' }}
        >
          <ShareIcon sx={{ fontSize: ICON_SIZE_SM }} />
        </IconButton>
      </Tooltip>
      <ShareDialog
        key={open ? `share-${conversationId}` : 'share-closed'}
        open={open}
        conversationId={conversationId}
        currentUserId={currentUserId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
