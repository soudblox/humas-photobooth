import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useSocket(onQueueUpdate, onConfigUpdate) {
	const socketRef = useRef(null);

	const connect = useCallback(() => {
		if (socketRef.current?.connected) return;

		socketRef.current = io(SOCKET_URL, {
			withCredentials: true,
			transports: ['websocket', 'polling'],
		});

		socketRef.current.on('connect', () => {
			console.log('Socket connected');
			socketRef.current.emit('join', 'photobooth');
		});

		socketRef.current.on('photobooth:queue:update', (data) => {
			onQueueUpdate?.(data);
		});

		socketRef.current.on('photobooth:config:update', (data) => {
			onConfigUpdate?.(data);
		});

		socketRef.current.on('disconnect', () => {
			console.log('Socket disconnected');
		});

		socketRef.current.on('error', (error) => {
			console.error('Socket error:', error);
		});
	}, [onQueueUpdate, onConfigUpdate]);

	const disconnect = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current = null;
		}
	}, []);

	useEffect(() => {
		return () => {
			disconnect();
		};
	}, [disconnect]);

	return { connect, disconnect, socket: socketRef };
}
