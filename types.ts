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

export interface DynamicVariable {
    id: string;
    name: string;
    value: string;
}

export interface PromptHistoryItem {
    id: string;
    promptData: VoiceAgentPromptData;
    generatedPrompt: string;
    timestamp: number;
    niche: string;
    variables?: DynamicVariable[];
}

export interface ShareablePromptData {
    promptData: VoiceAgentPromptData;
    generatedPrompt: string;
    niche: string;
    variables: DynamicVariable[];
}

// FIX: Removed the ApiKey interface. As per guidelines, the API key should be managed through environment variables, not through the UI.