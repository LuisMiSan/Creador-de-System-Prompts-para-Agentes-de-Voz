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

// FIX: Removed the ApiKey interface. As per guidelines, the API key should be managed through environment variables, not through the UI.
