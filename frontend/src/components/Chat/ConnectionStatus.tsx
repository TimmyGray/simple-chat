import { useTranslation } from 'react-i18next';
import { Box, Tooltip } from '@mui/material';
import type { ConnectionStatus as ConnectionStatusType } from '../../hooks/useWebSocket';

const CONNECTION_STATUS_DOT_SIZE = 8;

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const { t } = useTranslation();

  const label = t(`websocket.${status}`);

  return (
    <Tooltip title={label}>
      <Box
        role="status"
        aria-label={label}
        sx={{
          width: CONNECTION_STATUS_DOT_SIZE,
          height: CONNECTION_STATUS_DOT_SIZE,
          borderRadius: '50%',
          backgroundColor: status === 'connected'
            ? 'success.main'
            : status === 'connecting'
              ? 'warning.main'
              : 'text.disabled',
          transition: 'background-color 0.3s ease',
          flexShrink: 0,
        }}
      />
    </Tooltip>
  );
}
