import { Box, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

export default function EmptyState() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        opacity: 0.5,
      }}
    >
      <ChatBubbleOutlineIcon sx={{ fontSize: 64 }} />
      <Typography variant="h6">No conversation selected</Typography>
      <Typography variant="body2" color="text.secondary">
        Start a new chat or select an existing one
      </Typography>
    </Box>
  );
}
