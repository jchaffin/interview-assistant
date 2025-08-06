"use client";

import React, { createContext, useContext, useState } from "react";

interface LoggedEvent {
  id: string;
  timestamp: number;
  type: string;
  data: Record<string, unknown>;
  source: 'client' | 'server';
}

interface EventContextType {
  eventLogs: LoggedEvent[];
  logClientEvent: (eventObj: Record<string, unknown>, eventNameSuffix?: string) => void;
  logServerEvent: (eventObj: Record<string, unknown>, eventNameSuffix?: string) => void;
  clearEventLogs: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eventLogs, setEventLogs] = useState<LoggedEvent[]>([]);

  const logClientEvent = (eventObj: Record<string, unknown>, eventNameSuffix = "") => {
    const newEvent: LoggedEvent = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: `client_event${eventNameSuffix ? `_${eventNameSuffix}` : ""}`,
      data: eventObj,
      source: 'client',
    };
    setEventLogs(prev => [...prev, newEvent]);
  };

  const logServerEvent = (eventObj: Record<string, unknown>, eventNameSuffix = "") => {
    const newEvent: LoggedEvent = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: `server_event${eventNameSuffix ? `_${eventNameSuffix}` : ""}`,
      data: eventObj,
      source: 'server',
    };
    setEventLogs(prev => [...prev, newEvent]);
  };

  const clearEventLogs = () => {
    setEventLogs([]);
  };

  return (
    <EventContext.Provider value={{ eventLogs, logClientEvent, logServerEvent, clearEventLogs }}>
      {children}
    </EventContext.Provider>
  );
};