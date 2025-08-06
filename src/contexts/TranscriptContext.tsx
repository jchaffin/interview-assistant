"use client";

import React, { createContext, useContext, useState } from "react";

interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isSimulated?: boolean;
}

interface TranscriptBreadcrumb {
  id: string;
  text: string;
  agent?: Record<string, unknown>;
  timestamp: number;
}

interface TranscriptContextType {
  messages: TranscriptMessage[];
  breadcrumbs: TranscriptBreadcrumb[];
  addTranscriptMessage: (id: string, role: "user" | "assistant", content: string, isSimulated?: boolean) => void;
  addTranscriptBreadcrumb: (text: string, agent?: Record<string, unknown>) => void;
  clearTranscript: () => void;
}

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

export const useTranscript = () => {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
};

export const TranscriptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<TranscriptBreadcrumb[]>([]);

  const addTranscriptMessage = (id: string, role: "user" | "assistant", content: string, isSimulated = false) => {
    const newMessage: TranscriptMessage = {
      id,
      role,
      content,
      timestamp: Date.now(),
      isSimulated,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addTranscriptBreadcrumb = (text: string, agent?: Record<string, unknown>) => {
    const newBreadcrumb: TranscriptBreadcrumb = {
      id: Date.now().toString(),
      text,
      agent,
      timestamp: Date.now(),
    };
    setBreadcrumbs(prev => [...prev, newBreadcrumb]);
  };

  const clearTranscript = () => {
    setMessages([]);
    setBreadcrumbs([]);
  };

  return (
    <TranscriptContext.Provider value={{ messages, breadcrumbs, addTranscriptMessage, addTranscriptBreadcrumb, clearTranscript }}>
      {children}
    </TranscriptContext.Provider>
  );
};