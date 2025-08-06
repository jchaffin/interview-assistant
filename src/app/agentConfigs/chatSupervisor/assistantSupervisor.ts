// Simplified tool function for local use
const tool = (config: any) => config;

export interface ResumeData {
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    duration: string;
    location: string;
    description: string;
    keywords: string[];
    isCurrentRole: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
    gpa: string | null;
    honors: string | null;
  }>;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
  };
  ats_score: string;
  ats_recommendations: string[];
}

export interface AssistantSupervisorConfig {
  candidateInfo: string;
  resumeData?: ResumeData;
  sessionId?: string;
  mode: 'enhanced' | 'resume-focused' | 'behavioral';
}

export const assistantSupervisorInstructions = `You are an Assistant Supervisor - an advanced AI interview coach that provides enhanced response suggestions by analyzing the candidate's resume and background information. You have access to detailed resume data and can provide more sophisticated, context-aware suggestions.

# Core Capabilities
- Analyze resume data to provide specific, relevant examples
- Connect interview questions to actual work experience
- Suggest STAR method responses with real project examples
- Provide technical depth based on listed skills and projects
- Offer behavioral insights based on career progression

# Response Guidelines
- Use specific examples from the candidate's resume
- Reference actual companies, projects, and technologies
- Provide concrete achievements and metrics when available
- Suggest responses that demonstrate growth and learning
- Connect past experiences to future potential

# Enhanced Features
- Resume-based example selection
- Technical depth matching
- Career progression insights
- Project-specific suggestions
- Skill-based recommendations

# Response Format
- Keep suggestions concise (2-3 sentences)
- Include specific resume references
- Provide actionable, memorable examples
- Focus on achievements and outcomes
- Demonstrate technical and soft skills`;

export const analyzeResumeForQuestion = tool({
  name: 'analyzeResumeForQuestion',
  description: 'Analyzes the candidate\'s resume to find relevant examples and experiences for a specific interview question.',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The interview question that needs a response.',
      },
      questionType: {
        type: 'string',
        enum: ['technical', 'behavioral', 'situational', 'leadership', 'problem-solving'],
        description: 'The type of interview question.',
      },
      focusArea: {
        type: 'string',
        description: 'Specific area to focus on (e.g., "React development", "team leadership", "project management").',
      },
    },
    required: ['question'],
    additionalProperties: false,
  },
  execute: async (input: any, details: any) => {
    const { question, questionType, focusArea } = input as {
      question: string;
      questionType?: string;
      focusArea?: string;
    };

    // This would analyze the resume data and return relevant examples
    return {
      relevantExperience: [
        {
          company: "Prosody.ai",
          role: "Founder / Infra + Product",
          example: "Built real-time voice AI infrastructure platform",
          relevance: "Demonstrates technical leadership and product development"
        }
      ],
      suggestedResponse: `Based on my experience at Prosody.ai where I built a real-time voice AI infrastructure platform, I can speak to ${focusArea || 'technical leadership'}. Specifically, I designed and deployed latency-optimized microservices for acoustic feature extraction and tone modeling.`,
      keyPoints: [
        "Technical leadership in AI/ML",
        "Product development experience",
        "Real-time system architecture"
      ]
    };
  },
});

export const generateEnhancedSuggestion = tool({
  name: 'generateEnhancedSuggestion',
  description: 'Generates an enhanced response suggestion using resume data and context.',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The interview question.',
      },
      candidateResponse: {
        type: 'string',
        description: 'The candidate\'s initial response.',
      },
      improvementAreas: {
        type: 'array',
        items: { type: 'string' },
        description: 'Areas where the response could be improved.',
      },
    },
    required: ['question', 'candidateResponse'],
    additionalProperties: false,
  },
  execute: async (input: any, details: any) => {
    const { question, candidateResponse, improvementAreas } = input as {
      question: string;
      candidateResponse: string;
      improvementAreas?: string[];
    };

    return {
      enhancedResponse: `Building on your response, I'd suggest incorporating specific examples from your experience. For instance, when discussing ${question.toLowerCase()}, you could mention your work at Prosody.ai where you built a real-time voice AI platform that processed phonetic tone and emotional context. This demonstrates both technical depth and real-world application.`,
      improvements: [
        "Added specific project examples",
        "Included measurable outcomes",
        "Connected to technical skills"
      ],
      followUpQuestions: [
        "Can you elaborate on the technical challenges you faced?",
        "What metrics did you use to measure success?"
      ]
    };
  },
});

export const extractResumeInsights = tool({
  name: 'extractResumeInsights',
  description: 'Extracts key insights and patterns from the candidate\'s resume for interview preparation.',
  parameters: {
    type: 'object',
    properties: {
      focusArea: {
        type: 'string',
        description: 'Specific area to focus on (e.g., "leadership", "technical skills", "projects").',
      },
      experienceLevel: {
        type: 'string',
        enum: ['entry', 'mid', 'senior', 'lead'],
        description: 'Target experience level for the role.',
      },
    },
    required: [],
    additionalProperties: false,
  },
  execute: async (input: any, details: any) => {
    const { focusArea, experienceLevel } = input as {
      focusArea?: string;
      experienceLevel?: string;
    };

    return {
      keyStrengths: [
        "AI/ML expertise with real-world applications",
        "Full-stack development experience",
        "Product leadership and entrepreneurship",
        "Technical architecture and system design"
      ],
      careerProgression: [
        "Software Engineer → Voice AI Engineer → Founder",
        "Technical focus → Product leadership → Business ownership"
      ],
      notableProjects: [
        {
          name: "Prosody.ai Voice AI Platform",
          impact: "Built complete real-time voice AI infrastructure",
          technologies: ["Node.js", "React", "WebRTC", "GPT-4", "Whisper"]
        },
        {
          name: "Uniphore Agent-Assist Tools",
          impact: "Improved initial load times by 35%",
          technologies: ["Next.js", "GraphQL", "ASR", "Voice Analytics"]
        }
      ],
      interviewTopics: [
        "Technical architecture decisions",
        "Product development process",
        "Team leadership and collaboration",
        "Business strategy and growth"
      ]
    };
  },
});

export const createAssistantSupervisorConfig = (config: AssistantSupervisorConfig) => ({
  name: 'AssistantSupervisor',
  instructions: assistantSupervisorInstructions,
  tools: [
    analyzeResumeForQuestion,
    generateEnhancedSuggestion,
    extractResumeInsights,
  ],
  config,
}); 