import { useEffect, useCallback } from 'react';
import { socketService } from '@/services/socket';

export function useSocket() {
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    socketService.connect(WS_URL);

    return () => {
      socketService.disconnect();
    };
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketService.on(event, callback);
    return () => socketService.off(event, callback);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketService.emit(event, data);
  }, []);

  return {
    on,
    emit,
    isConnected: socketService.isConnected(),
    joinSession: socketService.joinSession.bind(socketService),
    leaveSession: socketService.leaveSession.bind(socketService),
  };
}
