"use client";

import { useTranscript } from "@/contexts/TranscriptContext";
import { useEvent } from "@/contexts/EventContext";

export function useHandleSessionHistory() {
  const {
    messages,
    breadcrumbs,
    addTranscriptBreadcrumb,
    addTranscriptMessage,
  } = useTranscript();
  const { logServerEvent } = useEvent();

  const handleHistoryAdded = (event: any) => {
    if (event.type === 'conversation.item.create' && event.item) {
      const item = event.item;
      
      if (item.type === 'message') {
        addTranscriptMessage(
          item.id,
          item.role,
          item.content?.[0]?.text || '',
          false
        );
      }
    }
  };

  const handleHistoryUpdated = (event: any) => {
    // Handle history updates if needed
    console.log('History updated:', event);
  };

  const handleAgentToolStart = (event: any) => {
    const toolName = event.tool?.name || 'Unknown Tool';
    addTranscriptBreadcrumb(`Agent started using: ${toolName}`, event.tool);
  };

  const handleAgentToolEnd = (event: any) => {
    const toolName = event.tool?.name || 'Unknown Tool';
    const result = event.result;
    
    addTranscriptBreadcrumb(
      `Agent finished using: ${toolName}`,
      { tool: event.tool, result }
    );
  };

  const handleGuardrailTripped = (event: any) => {
    const guardrailName = event.guardrail?.name || 'Unknown Guardrail';
    addTranscriptBreadcrumb(
      `Guardrail triggered: ${guardrailName}`,
      event.guardrail
    );
  };

  const handleAgentHandoff = (event: any) => {
    const fromAgent = event.from_agent?.name || 'Unknown Agent';
    const toAgent = event.to_agent?.name || 'Unknown Agent';
    
    addTranscriptBreadcrumb(
      `Agent handoff: ${fromAgent} → ${toAgent}`,
      { from: event.from_agent, to: event.to_agent }
    );
  };

  const handleTransportEvent = (event: any) => {
    // Log transport events for debugging
    logServerEvent(event, 'transport_event');
  };

  return {
    handleHistoryAdded,
    handleHistoryUpdated,
    handleAgentToolStart,
    handleAgentToolEnd,
    handleGuardrailTripped,
    handleAgentHandoff,
    handleTransportEvent,
  };
}