interface SessionConfig {
  interviewMode?: string;
  voiceId?: string;
  resumeData?: Record<string, unknown>;
  assistantMode?: string;
  type?: string;
}

interface Session {
  id: string;
  config: SessionConfig;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  createdAt: number;
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();

  createSession(candidateInfo: string, config: SessionConfig): Session {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: Session = {
      id: sessionId,
      config,
      messages: [],
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  addMessage(sessionId: string, message: { role: 'user' | 'assistant'; content: string }): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        ...message,
        timestamp: Date.now(),
      });
    }
  }

  completeSession(sessionId: string): void {
    // For now, just log completion
    console.log(`Session ${sessionId} completed`);
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}

export const sessionManager = new SessionManager();
