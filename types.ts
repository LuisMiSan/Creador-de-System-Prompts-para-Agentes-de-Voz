export interface VoiceAgentPromptData {
    // The order of these fields matches the form input order
    agentRole: string;
    task: string;
    personality: string;
    toneAndLanguage: string;
    context: string;
    responseGuidelines: string;
    stepByStep: string;
    notes: string;
}

export interface PromptHistoryItem {
    id: string;
    promptData: VoiceAgentPromptData;
    generatedPrompt: string;
    timestamp: number;
    niche: string;
}

// FIX: Add and export the ApiKey interface, which is used in ApiKeyManager.tsx.
export interface ApiKey {
    name: string;
    key: string;
}