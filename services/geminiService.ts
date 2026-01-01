
import { GoogleGenAI } from '@google/genai';
import { VoiceAgentPromptData } from '../types';

/**
 * Generates a refined system prompt using the Gemini API.
 */
export const generatePerfectPrompt = async (promptData: VoiceAgentPromptData): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    console.log("Generating prompt with Gemini API:", promptData);

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
**ROL Y OBJETIVO:**
Eres un experto en ingeniería de prompts para IA conversacional de voz. Tu misión es transformar las descripciones de un usuario en un "system prompt" de alta calidad, optimizado para plataformas como Vapi.ai y Retell AI. Actúas como un filtro de calidad, convirtiendo ideas en instrucciones precisas y ejecutables para una IA de voz.

**PRINCIPIOS CLAVE:**

1.  **ESTRUCTURA DE SALIDA OBLIGATORIA:** Tu respuesta DEBE usar exclusivamente el siguiente formato Markdown. Si una sección de entrada del usuario está vacía, OMITE el encabezado correspondiente en la salida. No inventes contenido.
    *   \`### IDENTIDAD Y COMPORTAMIENTO\`
    *   \`### OBJETIVO PRINCIPAL\`
    *   \`### BASE DE CONOCIMIENTO\`
    *   \`### REGLAS DE COMUNICACIÓN\`
    *   \`### PROTOCOLO DE CONVERSACIÓN\`
    *   \`### MANEJO DE EXCEPCIONES\`

2.  **SÍNTESIS NARRATIVA:** No te limites a copiar y pegar. Tu valor reside en la síntesis.
    *   **Fusiona** los conceptos de "Rol del Agente", "Personalidad" y "Tono y Lenguaje" en una única sección \`### IDENTIDAD Y COMPORTAMIENTO\`.
    *   **Crea una descripción coherente y narrativa.** No enumeres adjetivos. Describe al agente como si le dieras un briefing a un actor, creando una persona unificada y creíble.

3.  **LENGUAJE DE MANDO (IMPERATIVO):**
    *   Usa verbos de acción directos. Transforma sugerencias como "el agente debería ser amable" en "**SIEMPRE** sé amable".
    *   Utiliza listas con viñetas (-) para enumerar reglas y pasos, facilitando el procesamiento por parte de la IA.
    *   Enfatiza las directivas más críticas usando **negrita**.

4.  **OPTIMIZACIÓN PARA VOZ:**
    *   Prioriza la claridad y la concisión para minimizar la latencia.
    *   Desglosa información compleja en puntos simples y directos. El prompt debe ser escaneable y fácil de procesar en tiempo real.

5.  **CERO ADORNOS:**
    *   Tu única salida debe ser el prompt finalizado.
    *   **NO** incluyas saludos, explicaciones, notas introductorias ni bloques de código como \`\`\`markdown\`\`\`. Tu respuesta debe comenzar directamente con el primer encabezado (ej: \`### IDENTIDAD Y COMPORTAMIENTO\`). Esta es una regla inquebrantable.

---

**DATOS BRUTOS DEL USUARIO A PROCESAR:**

${filledSections}

---

**AHORA, EJECUTA TU MISIÓN. Construye el "system prompt" perfecto basándote estrictamente en los datos del usuario y en todos los principios y reglas definidos.**
    `.trim();

    try {
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
        throw new Error("Ocurrió un error al generar el prompt con IA.");
    }
};

/**
 * Generates suggestions for specific fields based on existing data.
 */
export const generateSuggestions = async (
    promptData: Partial<VoiceAgentPromptData>,
    targetField: 'responseGuidelines' | 'stepByStep' | 'notes',
    language: 'es' | 'en'
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Determine context string
    const contextStr = `
    ROLE: ${promptData.agentRole || 'Unknown'}
    TASK: ${promptData.task || 'Unknown'}
    PERSONALITY: ${promptData.personality || 'Unknown'}
    CONTEXT: ${promptData.context || 'Unknown'}
    `;

    let fieldDescription = "";
    if (targetField === 'responseGuidelines') {
        fieldDescription = "Response Guidelines (rules on how to speak, what to say/avoid, length of answers)";
    } else if (targetField === 'stepByStep') {
        fieldDescription = "Step-by-Step Conversation Flow (a numbered list of logical steps for the call)";
    } else if (targetField === 'notes') {
        fieldDescription = "Additional Notes/Exceptions (handling errors, edge cases, strict prohibitions)";
    }

    const prompt = `
    You are an AI Voice Agent Architect. 
    Based on the following agent details:
    ${contextStr}

    Please generate 3 DISTINCT, HIGH-QUALITY options for the field: "${fieldDescription}".
    
    Output requirements:
    1. The output MUST be a valid JSON array of strings. Example: ["Option 1 content", "Option 2 content", "Option 3 content"].
    2. The content must be in ${language === 'es' ? 'SPANISH' : 'ENGLISH'}.
    3. Option 1 should be concise and direct.
    4. Option 2 should be detailed and comprehensive.
    5. Option 3 should be creative or alternative approach.
    6. Do NOT return markdown formatting (no \`\`\`json). Just the raw JSON string.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text;
        if (!text) throw new Error("No suggestion generated");

        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
            return parsed.map(s => String(s));
        }
        return [];

    } catch (error) {
        console.error("Error generating suggestions:", error);
        throw new Error("Failed to generate suggestions");
    }
}
