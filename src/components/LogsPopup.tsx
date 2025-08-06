"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/contexts/EventContext";

export interface LogsPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

function LogsPopup({ isVisible, onClose }: LogsPopupProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<any[]>([]);
  const eventLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const { loggedEvents } = useEvent();

  const getDirectionArrow = (direction: string) => {
    if (direction === "client") return { symbol: "▲", color: "#7f5af0" };
    if (direction === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  useEffect(() => {
    const hasNewEvent = loggedEvents.length > prevEventLogs.length;

    if (isVisible && hasNewEvent && eventLogsContainerRef.current) {
      eventLogsContainerRef.current.scrollTop =
        eventLogsContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(loggedEvents);
  }, [loggedEvents, isVisible, prevEventLogs.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-3/4 h-3/4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Debug Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div 
          ref={eventLogsContainerRef}
          className="flex-1 overflow-auto p-4"
        >
          {loggedEvents.length === 0 ? (
            <div className="text-center text-gray-500">
              No logs yet
            </div>
          ) : (
            loggedEvents.map((log, idx) => {
              const arrowInfo = getDirectionArrow(log.direction);
              const isError = log.eventName.toLowerCase().includes("error");

              return (
                <div
                  key={`${log.id}-${idx}`}
                  className="border-b border-gray-200 py-2 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span
                        style={{ color: arrowInfo.color }}
                        className="mr-2"
                      >
                        {arrowInfo.symbol}
                      </span>
                      <span
                        className={
                          "text-sm " +
                          (isError ? "text-red-600" : "text-gray-800")
                        }
                      >
                        {log.eventName}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs whitespace-nowrap">
                      {log.timestamp}
                    </div>
                  </div>

                  {log.eventData && Object.keys(log.eventData).length > 0 && (
                    <div className="text-gray-800 text-left mt-2">
                      <pre className="border-l-2 ml-1 border-gray-200 whitespace-pre-wrap break-words font-mono text-xs pl-2">
                        {JSON.stringify(log.eventData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default LogsPopup; 