import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../state/authStore";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let socket: Socket | null = null;

/** Lazy singleton. The access token is supplied via an auth callback (not a static object)
 * so a reconnect always re-reads the latest token instead of the one captured at connect
 * time — access tokens expire every 15min (JWT_ACCESS_TTL), same TTL the REST client's
 * refresh dance in api/client.ts already handles. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
