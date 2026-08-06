"use client";

import { useCurrentUser } from "../hooks";

export function AuthBootstrap() {
  useCurrentUser();
  return null;
}
