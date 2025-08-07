"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/contexts/EventContext";

export interface LogsPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

function LogsPopup({ isVisible, onClose }: LogsPopupProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<any[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const eventLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const { loggedEvents } = useEvent();

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

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
    <div 
      className={`fixed left-0 right-0 bg-white border-t border-gray-300 shadow-lg transition-transform duration-300 ease-in-out z-50 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ height: '25vh', bottom: '80px' }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Debug Logs</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div 
        ref={eventLogsContainerRef}
        className="h-full overflow-auto p-3"
      >
          {loggedEvents.length === 0 ? (
            <div className="text-center text-gray-500">
              No logs yet
            </div>
          ) : (
            loggedEvents.map((log, idx) => {
              const arrowInfo = getDirectionArrow(log.direction);
              const isError = log.eventName.toLowerCase().includes("error");
              const logId = `${log.id}-${idx}`;
              const isExpanded = expandedLogs.has(logId);
              const hasEventData = log.eventData && Object.keys(log.eventData).length > 0;

              return (
                <div
                  key={logId}
                  className="border-b border-gray-200 py-2 font-mono"
                >
                  <div 
                    className={`flex items-center justify-between ${hasEventData ? 'cursor-pointer hover:bg-gray-50 px-1 py-1 rounded' : ''}`}
                    onClick={() => hasEventData && toggleLogExpansion(logId)}
                  >
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
                      {hasEventData && (
                        <span className="ml-2 text-gray-400 text-xs">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs whitespace-nowrap">
                      {log.timestamp}
                    </div>
                  </div>

                  {hasEventData && isExpanded && (
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
  );
}

export default LogsPopup; 