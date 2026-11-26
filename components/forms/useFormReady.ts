"use client";

import {useSyncExternalStore} from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useFormReady() {
  // Keep the server-rendered controls disabled until React has attached the submit handler.
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
