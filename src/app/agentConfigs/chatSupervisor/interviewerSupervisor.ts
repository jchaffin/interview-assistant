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

export interface InterviewerSupervisorConfig {
  candidateInfo: string;
  resumeData?: ResumeData;
  sessionId?: string;
  mode: 'conversational' | 'technical' | 'behavioral';
}

export const interviewerSupervisorInstructions = `You are an Interviewer Supervisor - an advanced AI that enhances interview questions by analyzing the job description and the candidates background and experience. You help create more targeted, relevant, and insightful interview questions.

# Core Capabilities
- Analyze resume data to create personalized interview questions
- Suggest follow-up questions based on candidate's experience
- Provide technical depth questions based on listed skills
- Generate behavioral questions using STAR method with resume context

- Adapt questions based on career progression and project experience

# Question Enhancement Guidelines
- Use specific examples from the candidate's resume
- Reference actual companies, projects, and technologies
- Create questions that demonstrate understanding of their background
- Provide questions that assess both technical and soft skills
- Generate follow-up questions that dig deeper into experiences

# Enhanced Features
- Resume-based question customization
- Technical skill assessment questions
- Project-specific behavioral questions
- Career progression insights
- Leadership and teamwork assessment

# Question Format
- Keep questions clear and specific
- Include context from resume when relevant
- Provide 2-3 follow-up questions for each main question
- Focus on achievements and outcomes
- Assess both technical competence and cultural fit`;

export const analyzeResumeForQuestions = tool({
  name: 'analyzeResumeForQuestions',
  description: 'Analyzes the candidate\'s resume to suggest personalized interview questions.',
  parameters: {
    type: 'object',
    properties: {
      questionType: {
        type: 'string',
        enum: ['technical', 'behavioral', 'situational', 'leadership', 'project-specific'],
        description: 'The type of interview question to generate.',
      },
      focusArea: {
        type: 'string',
        description: 'Specific area to focus on (e.g., "React development", "team leadership", "project management").',
      },
      currentContext: {
        type: 'string',
        description: 'Current conversation context or previous question.',
      },
    },
    required: ['questionType'],
    additionalProperties: false,
  },
  execute: async (input: any, details: any) => {
    const { questionType, focusArea, currentContext } = input as {
      questionType: string;
      focusArea?: string;
      currentContext?: string;
    };

    const config = (details?.context as any)?.config as InterviewerSupervisorConfig;

    if (!config.resumeData) {
      return {
        suggestedQuestions: [],
        followUpQuestions: [],
        resumeContext: 'No resume data available',
        message: 'Using general interview questions.'
      };
    }

    // Analyze resume data for relevant question generation
    const relevantExperience = config.resumeData.experience.filter((exp: any) => {
      if (!focusArea) return true;
      const keywordsLower = exp.keywords.map((k: string) => k.toLowerCase());
      const roleLower = exp.role.toLowerCase();
      const descLower = exp.description.toLowerCase();
      return keywordsLower.some((keyword: string) => focusArea.toLowerCase().includes(keyword)) ||
             roleLower.includes(focusArea.toLowerCase()) ||
             descLower.includes(focusArea.toLowerCase());
    });

    // Use experience entries as projects since projects don't exist in ResumeData interface
    const relevantProjects = config.resumeData.experience.filter((exp: any) => {
      if (!focusArea) return true;
      const keywordsLower = exp.keywords.map((k: string) => k.toLowerCase());
      const descLower = exp.description.toLowerCase();
      return keywordsLower.some((keyword: string) => focusArea.toLowerCase().includes(keyword)) ||
             descLower.includes(focusArea.toLowerCase());
    });

    let suggestedQuestions: string[] = [];
    let followUpQuestions: string[] = [];

    switch (questionType) {
      case 'technical':
        const techSkills = config.resumeData.skills.slice(0, 5);
        suggestedQuestions = [
          `I see you have experience with ${techSkills.join(', ')}. Can you walk me through a technical challenge you solved using these technologies?`,
          `Your resume shows work with various technologies. What was the most complex system you've designed and what challenges did you face?`,
          `I notice you've worked with ${relevantProjects[0]?.keywords.slice(0, 3).join(', ') || 'various technologies'}. What's your approach to learning new technologies?`
        ];
        followUpQuestions = [
          'What was the scale of the system you worked on?',
          'How did you handle performance optimization?',
          'What debugging strategies do you typically use?'
        ];
        break;

      case 'behavioral':
        const recentExperience = relevantExperience[0];
        suggestedQuestions = [
          `I see you worked as ${recentExperience?.role} at ${recentExperience?.company}. Can you tell me about a time when you had to lead a challenging project?`,
          `Your resume mentions various experiences. Can you share a specific example of how you helped someone grow in their role?`,
          `I notice you've worked on projects with significant impact. Can you describe a situation where you had to make a difficult technical decision?`
        ];
        followUpQuestions = [
          'What was the outcome of that situation?',
          'What would you do differently if faced with the same challenge?',
          'How did you handle any conflicts that arose?'
        ];
        break;

      case 'project-specific':
        const featuredProject = relevantProjects[0];
        suggestedQuestions = [
          `I'm interested in your work at ${featuredProject?.company}. Can you walk me through the technical architecture and your role in it?`,
          `Your experience at ${featuredProject?.company} shows impressive outcomes. What was the biggest technical challenge you overcame?`,
          `Looking at your experience, what role are you most proud of and why?`
        ];
        followUpQuestions = [
          'How did you handle the project timeline and scope?',
          'What technologies would you use differently now?',
          'How did you measure the success of this project?'
        ];
        break;

      case 'leadership':
        const leadershipExp = relevantExperience.filter((exp: any) => 
          exp.role.toLowerCase().includes('lead') || 
          exp.role.toLowerCase().includes('senior') ||
          exp.role.toLowerCase().includes('manager')
        );
        suggestedQuestions = [
          `I see you've taken on leadership roles. Can you tell me about a time when you had to motivate a team through a difficult period?`,
          `Your resume shows experience in various roles. How do you approach giving constructive feedback?`,
          `As someone who has worked on technical projects, how do you balance technical excellence with business requirements?`
        ];
        followUpQuestions = [
          'How did you measure the team\'s success?',
          'What leadership style do you find most effective?',
          'How do you handle disagreements within your team?'
        ];
        break;

      case 'situational':
        suggestedQuestions = [
          `Imagine you're working on a project and discover a critical bug in production. How would you handle this situation?`,
          `If you had to explain a complex technical concept to a non-technical stakeholder, how would you approach it?`,
          `How would you handle a situation where a team member consistently misses deadlines?`
        ];
        followUpQuestions = [
          'What steps would you take to prevent this in the future?',
          'How would you communicate this to different stakeholders?',
          'What resources would you need to resolve this effectively?'
        ];
        break;
    }

    return {
      suggestedQuestions: suggestedQuestions.slice(0, 2),
      followUpQuestions: followUpQuestions.slice(0, 3),
      resumeContext: `Based on ${config.resumeData.experience.length} years of experience, ${config.resumeData.experience.length} major roles, and expertise in ${config.resumeData.skills.slice(0, 5).join(', ')}`,
      questionType,
      focusArea: focusArea || 'general'
    };
  },
});

export const generateEnhancedQuestion = tool({
  name: 'generateEnhancedQuestion',
  description: 'Generates an enhanced interview question using resume data and context.',
  parameters: {
    type: 'object',
    properties: {
      baseQuestion: {
        type: 'string',
        description: 'The base interview question to enhance.',
      },
      resumeAnalysis: {
        type: 'object',
        description: 'The analysis results from analyzeResumeForQuestions.',
      },
      candidateBackground: {
        type: 'string',
        description: 'General candidate background information.',
      },
    },
    required: ['baseQuestion', 'resumeAnalysis'],
    additionalProperties: false,
  },
  execute: async (input: any, details: any) => {
    const { baseQuestion, resumeAnalysis, candidateBackground } = input as {
      baseQuestion: string;
      resumeAnalysis: any;
      candidateBackground?: string;
    };

    const config = (details?.context as any)?.config as InterviewerSupervisorConfig;

    const systemPrompt = `You are an Interviewer Supervisor enhancing interview questions.

${interviewerSupervisorInstructions}

Candidate Background: ${candidateBackground || 'Not provided'}

Resume Analysis: ${JSON.stringify(resumeAnalysis)}

Enhance this interview question: "${baseQuestion}"

Make it more specific and relevant to the candidate's background. Keep it to 1-2 sentences maximum.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Enhance this question: ${baseQuestion}` }
          ],
          stream: false,
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate enhanced question');
      }

      const result = await response.json();
      const enhancedQuestion = result.message?.content || baseQuestion;

      return { 
        enhancedQuestion,
        usedResumeData: resumeAnalysis.resumeContext && resumeAnalysis.resumeContext !== 'No resume data available'
      };
    } catch (error) {
      console.error('Error generating enhanced question:', error);
      return { 
        enhancedQuestion: baseQuestion,
        usedResumeData: false
      };
    }
  },
});

export const createInterviewerSupervisorConfig = (config: InterviewerSupervisorConfig) => ({
  name: 'interviewerSupervisor',
  instructions: interviewerSupervisorInstructions,
  tools: [analyzeResumeForQuestions, generateEnhancedQuestion],
  config,
}); 