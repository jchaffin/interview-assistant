import { useState, useCallback } from 'react';
import { guardrails, GuardrailResult, GuardrailConfig } from '@/lib/guardrails';

export function useGuardrails() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState<GuardrailResult | null>(null);

  const analyzeContent = useCallback(async (content: string): Promise<GuardrailResult> => {
    setIsAnalyzing(true);
    try {
      const result = await guardrails.analyzeContent(content);
      setLastResult(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeResponse = useCallback(async (response: string, context?: string): Promise<GuardrailResult> => {
    setIsAnalyzing(true);
    try {
      const result = await guardrails.analyzeResponse(response, context);
      setLastResult(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<GuardrailConfig>) => {
    guardrails.updateConfig(newConfig);
  }, []);

  const getConfig = useCallback(() => {
    return guardrails.getConfig();
  }, []);

  const resetRateLimit = useCallback((userId: string) => {
    guardrails.resetRateLimit(userId);
  }, []);

  return {
    analyzeContent,
    analyzeResponse,
    updateConfig,
    getConfig,
    resetRateLimit,
    isAnalyzing,
    lastResult
  };
} 