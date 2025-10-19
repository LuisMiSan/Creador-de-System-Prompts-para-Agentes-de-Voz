export interface VoiceAgentPromptData {
    agentRole: string;
    personality: string;
    toneAndLanguage: string;
    responseGuidelines: string;
    task: string;
    context: string;
    stepByStep: string;
    notes: string;
}

export interface PromptHistoryItem {
    id: string;
    promptData: VoiceAgentPromptData;
    generatedPrompt: string;
    timestamp: number;
}

export interface ApiKey {
    name: string;
    key: string;
}