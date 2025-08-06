import { simpleHandoffScenario } from './simpleHandoff';
import { customerServiceRetailScenario } from './customerServiceRetail';
import { chatSupervisorScenario } from './chatSupervisor';
import { 
  interviewerScenario, 
  interviewAssistantScenario, 
  interviewCombinedScenario,
  technicalInterviewScenario,
  behavioralInterviewScenario,
  leadershipInterviewScenario
} from './interview';

import type { RealtimeAgent } from '@openai/agents/realtime';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  interviewer: interviewerScenario,
  interviewAssistant: interviewAssistantScenario,
  interviewCombined: interviewCombinedScenario,
  technicalInterview: technicalInterviewScenario,
  behavioralInterview: behavioralInterviewScenario,
  leadershipInterview: leadershipInterviewScenario,
};

export const defaultAgentSetKey = 'interviewCombined';
