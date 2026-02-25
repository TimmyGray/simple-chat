import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import type { Conversation, ConversationId } from '../../types';
import { useSearch } from '../../hooks/useSearch';
import {
  SEARCH_DIALOG_WIDTH,
  SEARCH_RESULT_MAX_HEIGHT,
  LOADING_SPINNER_SM,
} from '../../constants';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: ConversationId) => void;
}

export default function SearchDialog({ open, onClose, onSelect }: SearchDialogProps) {
  const { t } = useTranslation();
  const { query, results, loading, error, setQuery, reset } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Clamp selectedIndex to valid range during render (derived value, no state update)
  const clampedIndex = results.length > 0
    ? Math.min(selectedIndex, results.length - 1)
    : 0;

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setSelectedIndex(0);
    },
    [setQuery],
  );

  const handleExited = useCallback(() => {
    reset();
    setSelectedIndex(0);
  }, [reset]);

  const handleSelect = useCallback(
    (conversation: Conversation) => {
      onSelect(conversation._id);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results[clampedIndex]) {
            handleSelect(results[clampedIndex]);
          }
          break;
      }
    },
    [results, clampedIndex, handleSelect],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      TransitionProps={{ onExited: handleExited }}
      PaperProps={{
        sx: {
          width: SEARCH_DIALOG_WIDTH,
          maxWidth: '95vw',
          position: 'fixed',
          top: '15%',
          m: 0,
          borderRadius: 3,
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder={t('search.placeholder')}
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={LOADING_SPINNER_SM} />
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              '& fieldset': { border: 'none' },
            },
            '& .MuiOutlinedInput-input': {
              py: 2,
              fontSize: '1rem',
            },
          }}
        />

        {query.trim() && !loading && results.length === 0 && !error && (
          <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('search.noResults')}
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}

        {results.length > 0 && (
          <>
            <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
            <List
              dense
              disablePadding
              sx={{ maxHeight: SEARCH_RESULT_MAX_HEIGHT, overflow: 'auto' }}
            >
              {results.map((conv, index) => (
                <ListItemButton
                  key={conv._id}
                  selected={index === clampedIndex}
                  onClick={() => handleSelect(conv)}
                  sx={{
                    px: 3,
                    py: 1,
                    '&.Mui-selected': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18),
                    },
                  }}
                >
                  <ListItemText
                    primary={conv.title}
                    secondary={formatDate(conv.updatedAt)}
                    primaryTypographyProps={{
                      noWrap: true,
                      variant: 'body2',
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </>
        )}

        {!query.trim() && (
          <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('search.hint')}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
