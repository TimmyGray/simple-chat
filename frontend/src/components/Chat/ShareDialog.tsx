import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Box,
  CircularProgress,
  Typography,
  Chip,
  TextField,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useTranslation } from 'react-i18next';
import type { ConversationId, ParticipantRole } from '../../types';
import { useSharing } from '../../hooks/useSharing';
import { ICON_SIZE_SM, LOADING_SPINNER_LG, ERROR_SNACKBAR_AUTO_HIDE_MS } from '../../constants';

interface ShareDialogProps {
  open: boolean;
  conversationId: ConversationId;
  currentUserId: string;
  onClose: () => void;
}

export default function ShareDialog({ open, conversationId, currentUserId, onClose }: ShareDialogProps) {
  const { t } = useTranslation();
  const { participants, loading, inviting, error, clearError, fetchParticipants, invite, revoke } = useSharing();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ParticipantRole>('viewer');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void fetchParticipants(conversationId);
    }
  }, [open, conversationId, fetchParticipants]);

  const handleInvite = useCallback(async () => {
    if (!email.trim()) return;
    const success = await invite(conversationId, email.trim(), role);
    if (success) {
      setEmail('');
      setSuccessMessage(t('sharing.inviteSuccess'));
    }
  }, [conversationId, email, role, invite, t]);

  const handleRevoke = useCallback(async (userId: string) => {
    await revoke(conversationId, userId);
  }, [conversationId, revoke]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email.trim()) {
      e.preventDefault();
      void handleInvite();
    }
  }, [email, handleInvite]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('sharing.shareConversation')}
          <IconButton onClick={onClose} size="small" aria-label={t('common.cancel')}>
            <CloseIcon sx={{ fontSize: ICON_SIZE_SM }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
            <TextField
              size="small"
              placeholder={t('sharing.invitePlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={inviting}
              type="email"
              sx={{ flex: 1 }}
            />
            <Select
              size="small"
              value={role}
              onChange={(e) => setRole(e.target.value as ParticipantRole)}
              disabled={inviting}
              sx={{ minWidth: 110 }}
            >
              <MenuItem value="viewer">{t('sharing.roleViewer')}</MenuItem>
              <MenuItem value="editor">{t('sharing.roleEditor')}</MenuItem>
            </Select>
            <Button
              variant="contained"
              startIcon={inviting ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
              onClick={handleInvite}
              disabled={inviting || !email.trim()}
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('sharing.invite')}
            </Button>
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {t('sharing.participants')}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={LOADING_SPINNER_LG} />
            </Box>
          ) : participants.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {t('sharing.noParticipants')}
            </Typography>
          ) : (
            <List disablePadding>
              {participants.map((participant) => (
                <ListItem
                  key={participant.userId}
                  sx={{ px: 0, borderBottom: 1, borderColor: 'divider' }}
                  secondaryAction={
                    participant.userId !== currentUserId && (
                      <Tooltip title={t('sharing.removeParticipant')}>
                        <IconButton
                          size="small"
                          onClick={() => void handleRevoke(participant.userId)}
                          aria-label={t('sharing.removeParticipant')}
                          color="error"
                        >
                          <PersonRemoveIcon sx={{ fontSize: ICON_SIZE_SM }} />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.main' }}>
                      {participant.email.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" noWrap>
                          {participant.email}
                          {participant.userId === currentUserId && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              {' '}{t('sharing.you')}
                            </Typography>
                          )}
                        </Typography>
                        <Chip
                          label={t(`sharing.role${participant.role.charAt(0).toUpperCase()}${participant.role.slice(1)}`)}
                          size="small"
                          variant="outlined"
                          color={participant.role === 'editor' ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

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

      <Snackbar
        open={!!successMessage}
        autoHideDuration={ERROR_SNACKBAR_AUTO_HIDE_MS}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
