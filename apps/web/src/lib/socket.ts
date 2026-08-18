import { io, type Socket } from "socket.io-client";
import { env } from "./env";
import { getAccessToken } from "@/features/auth/store/auth-store";

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(`${env.NEXT_PUBLIC_WS_URL}/chat`, {
      autoConnect: false,
      auth: (callback) => callback({ token: getAccessToken() }),
    });
  }
  return socket;
}
