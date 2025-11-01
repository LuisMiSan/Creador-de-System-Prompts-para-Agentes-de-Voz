import { GoogleGenAI } from '@google/genai';
import { VoiceAgentPromptData } from '../types';

// FIX: Initialize the GoogleGenAI client using the API key from environment variables,
// as per the coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


/**
 * Generates a refined system prompt using the Gemini API.
 * @param promptData - The user-provided data for the voice agent.
 * @returns A promise that resolves to a string containing the generated system prompt.
 */
export const generatePerfectPrompt = async (promptData: VoiceAgentPromptData): Promise<string> => {
    console.log("Generating prompt with Gemini API:", promptData);

    // FIX: Replaced the mocked implementation with a real call to the Gemini API.
    // Construct a detailed prompt for the AI to generate a high-quality system prompt.
    const sections = [
        { label: "ROL DEL AGENTE", value: promptData.agentRole },
        { label: "TAREA PRINCIPAL", value: promptData.task },
        { label: "PERSONALIDAD", value: promptData.personality },
        { label: "TONO Y LENGUAJE", value: promptData.toneAndLanguage },
        { label: "CONTEXTO (BASE DE CONOCIMIENTO)", value: promptData.context },
        { label: "DIRECTRICES DE RESPUESTA", value: promptData.responseGuidelines },
        { label: "FLUJO DE CONVERSACIÓN (PASO A PASO)", value: promptData.stepByStep },
        { label: "NOTAS ADICIONALES", value: promptData.notes },
    ];

    const filledSections = sections
        .filter(section => section.value && section.value.trim() !== '')
        .map(section => `### ${section.label}\n${section.value.trim()}`)
        .join('\n\n');

    const generationPrompt = `
Eres un experto de clase mundial en la creación de "system prompts" para agentes de voz de IA conversacional (como los usados en Vapi.ai o Retell AI).
Tu tarea es tomar los siguientes datos estructurados proporcionados por un usuario y transformarlos en un system prompt optimizado, claro, conciso y altamente efectivo.
El prompt debe ser robusto y guiar al modelo de IA para que se comporte exactamente como se espera.

**Instrucciones Clave:**
1.  **Síntesis y Estructura:** No te limites a concatenar los campos. Sintetiza la información en un prompt coherente y bien estructurado. Usa formato Markdown (encabezados, listas) para mejorar la legibilidad y el énfasis.
2.  **Claridad y Precisión:** Usa un lenguaje imperativo y directo (ej: "Debes...", "Nunca...", "Siempre..."). Evita ambigüedades.
3.  **Completitud:** Asegúrate de que todos los datos proporcionados por el usuario se vean reflejados en el prompt final.
4.  **Formato de Salida:** La salida debe ser **únicamente** el texto del system prompt. No incluyas explicaciones, introducciones, saludos, despedidas o cualquier texto que no sea parte del prompt en sí. El resultado debe ser directamente copiable y pegable en una configuración de agente de voz.

---
**DATOS ESTRUCTURADOS DE ENTRADA:**

${filledSections}
---

Ahora, genera el system prompt optimizado.
    `.trim();

    try {
        // Per guidelines, use 'gemini-2.5-flash' for basic text tasks.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: generationPrompt,
        });
        
        const text = response.text;
        
        if (!text) {
            throw new Error("La respuesta de la API no contiene texto.");
        }
        
        return text;
    } catch (error) {
        console.error("Error al llamar a la API de Gemini:", error);
        // Propagate a more user-friendly error message.
        if (error instanceof Error) {
            throw new Error(`Error al generar el prompt con IA: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al generar el prompt con IA.");
    }
};
