"use client";

import {createContext, useContext, useState, type ReactNode} from "react";

const QuoteRequestContext = createContext<{
  message: string;
  setMessage: (message: string) => void;
  requestVersion: number;
  request: (message: string) => void;
} | null>(null);

export function QuoteRequestProvider({children}: {children: ReactNode}) {
  const [message, setMessage] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);
  return <QuoteRequestContext.Provider value={{message, setMessage, requestVersion, request: message => {
    setMessage(message);
    setRequestVersion(version => version + 1);
  }}}>{children}</QuoteRequestContext.Provider>;
}

export function useQuoteRequest() {
  return useContext(QuoteRequestContext);
}
