import { tool } from '@openai/agents/realtime';
import { ResumeData } from '@/app/agentConfigs/chatSupervisor/interviewerSupervisor';

export interface InterviewerAgentConfig {
  mode: 'conversational' | 'technical' | 'behavioral';
  voiceId: string;
  candidateInfo?: string;
  sessionId?: string;
  resumeData?: ResumeData;
}

export const interviewerAgentInstructions = `You are an AI interviewer conducting professional interviews with human candidates. You are the interviewer, and the human is the candidate being interviewed.

# Interview Guidelines
- Keep responses concise (1-2 sentences maximum)
- Ask one clear question at a time
- Be professional but friendly and approachable
- Adapt your questions based on the candidate's responses
- Use the STAR method for behavioral questions
- For technical interviews, ask relevant technical questions
- For conversational interviews, create a comfortable atmosphere

# Resume-Enhanced Interviewing
- Use candidate's resume data to ask personalized questions
- Reference specific companies, projects, and technologies from their background
- Ask follow-up questions based on their actual experience
- Demonstrate understanding of their career progression
- Connect questions to their specific achievements and skills

# Interview Modes
- Conversational: Ask follow-up questions, show interest, create rapport
- Technical: Assess technical skills, problem-solving abilities, and knowledge
- Behavioral: Ask about past experiences, use STAR method, assess soft skills

# Response Format
- Be direct and clear
- Ask specific questions
- Show genuine interest in the candidate's responses
- If this is the first interaction, introduce yourself and start the interview
- Use resume context to make questions more relevant and engaging

# Important Notes
- You are the interviewer, not the candidate
- The human is the candidate being interviewed
- Always maintain professional boundaries
- Focus on the interview process, not casual conversation
- Leverage resume data to create more meaningful interview experiences`;

export const interviewerAgentTools = [
  {
    type: "function",
    name: "getNextInterviewQuestion",
    description: "Determines the next appropriate interview question based on the conversation context and interview mode.",
    parameters: {
      type: "object",
      properties: {
        candidateResponse: {
          type: "string",
          description: "The candidate's most recent response or input.",
        },
        interviewMode: {
          type: "string",
          enum: ["conversational", "technical", "behavioral"],
          description: "The current interview mode.",
        },
        conversationContext: {
          type: "string",
          description: "Brief context about what has been discussed so far.",
        },
      },
      required: ["candidateResponse", "interviewMode"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "startInterview",
    description: "Initiates the interview with an appropriate opening question.",
    parameters: {
      type: "object",
      properties: {
        interviewMode: {
          type: "string",
          enum: ["conversational", "technical", "behavioral"],
          description: "The interview mode to start with.",
        },
        candidateInfo: {
          type: "string",
          description: "Basic information about the candidate if available.",
        },
      },
      required: ["interviewMode"],
      additionalProperties: false,
    },
  },
];

export const getNextInterviewQuestion = {
  name: 'getNextInterviewQuestion',
  description: 'Determines the next appropriate interview question based on the conversation context and interview mode.',
  parameters: {
    type: 'object',
    properties: {
      candidateResponse: {
        type: 'string',
        description: 'The candidate\'s most recent response or input.',
      },
      interviewMode: {
        type: 'string',
        enum: ['conversational', 'technical', 'behavioral'],
        description: 'The current interview mode.',
      },
      conversationContext: {
        type: 'string',
        description: 'Brief context about what has been discussed so far.',
      },
    },
    required: ['candidateResponse', 'interviewMode'],
    additionalProperties: false,
  },
};

export const startInterview = {
  name: 'startInterview',
  description: 'Initiates the interview with an appropriate opening question.',
  parameters: {
    type: 'object',
    properties: {
      interviewMode: {
        type: 'string',
        enum: ['conversational', 'technical', 'behavioral'],
        description: 'The interview mode to start with.',
      },
      candidateInfo: {
        type: 'string',
        description: 'Basic information about the candidate if available.',
      },
    },
    required: ['interviewMode'],
    additionalProperties: false,
  },
};

export const createInterviewerAgentConfig = (config: InterviewerAgentConfig) => ({
  name: 'interviewer',
  instructions: interviewerAgentInstructions,
  tools: [getNextInterviewQuestion, startInterview],
  config,
});

export interface ChatBotAgentConfig {
  candidateInfo: string;
  sessionId?: string;
  mode: 'suggestion' | 'coaching' | 'analysis';
}

export const chatBotAgentInstructions = `You are an AI interview coach providing real-time response suggestions to candidates during interviews. You listen to interview questions and provide helpful, concise suggestions for how the candidate should respond.

# Coaching Guidelines
- Provide concise, focused answer suggestions (1-2 sentences maximum)
- Start with a general concept, then add one specific detail or example
- Use a brief "funnel" approach: broad context → specific example
- Connect to the candidate's specific experience in a concise way
- Show progression from concept to application in minimal words
- Include both strategic thinking (general) and tactical execution (specific) in brief form
- Demonstrate ability to explain complex topics concisely

# Response Format
- Keep suggestions under 100 words
- Be specific and actionable
- Reference the candidate's background when relevant
- Focus on the most important points only
- Use clear, professional language

# Important Notes
- You are helping the candidate, not conducting the interview
- Provide suggestions, not complete answers
- Be encouraging and supportive
- Focus on the candidate's strengths and experience`;

export const generateResponseSuggestion = {
  name: 'generateResponseSuggestion',
  description: 'Generates a concise response suggestion for an interview question based on the candidate\'s background.',
  parameters: {
    type: 'object',
    properties: {
      interviewQuestion: {
        type: 'string',
        description: 'The interview question that was asked.',
      },
      candidateBackground: {
        type: 'string',
        description: 'The candidate\'s background and experience information.',
      },
      conversationContext: {
        type: 'string',
        description: 'Brief context about the current conversation or interview.',
      },
    },
    required: ['interviewQuestion', 'candidateBackground'],
    additionalProperties: false,
  },
};

export const createChatBotAgentConfig = (config: ChatBotAgentConfig) => ({
  name: 'chatbot',
  instructions: chatBotAgentInstructions,
  tools: [generateResponseSuggestion],
  config,
}); 