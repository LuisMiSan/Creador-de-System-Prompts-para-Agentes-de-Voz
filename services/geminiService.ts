import { GoogleGenAI } from '@google/genai';
import { VoiceAgentPromptData } from '../types';

/**
 * Generates a refined system prompt using the Gemini API.
 * @param promptData - The user-provided data for the voice agent.
 * @returns A promise that resolves to a string containing the generated system prompt.
 */
// FIX: The apiKey parameter has been removed to adhere to the guideline of exclusively using process.env.API_KEY.
export const generatePerfectPrompt = async (promptData: VoiceAgentPromptData): Promise<string> => {
    // FIX: Initialize GoogleGenAI with the API key from environment variables as per guidelines. The apiKey is assumed to be available.
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

**EJEMPLO DE APLICACIÓN:**

*   **DATOS DE ENTRADA DEL USUARIO:**
    \`\`\`
    ### ROL DEL AGENTE
    Asistente de reservas para "Restaurante Fusión".
    ### TAREA PRINCIPAL
    Agendar reservas de mesa.
    ### PERSONALIDAD
    Amable, eficiente.
    ### CONTEXTO
    Horario: 13:00 a 22:00. No se reserva para más de 8 personas por teléfono.
    ### PASO A PASO
    1. Preguntar por número de comensales. 2. Preguntar fecha y hora. 3. Confirmar disponibilidad. 4. Pedir nombre.
    \`\`\`

*   **PROMPT GENERADO (SALIDA IDEAL):**
    \`\`\`
### IDENTIDAD Y COMPORTAMIENTO
Eres un asistente virtual del "Restaurante Fusión". Tu comportamiento es siempre amable y altamente eficiente, enfocado en facilitar el proceso de reserva de forma rápida y agradable para el cliente.

### OBJETIVO PRINCIPAL
Tu única misión es gestionar y confirmar las reservas de mesa solicitadas por los clientes a través de la llamada.

### BASE DE CONOCIMIENTO
- Horario de atención para reservas: 13:00 a 22:00.
- Límite de comensales por reserva telefónica: 8 personas. Para grupos más grandes, deben visitar la web.

### PROTOCOLO DE CONVERSACIÓN
1.  **Inicia la cualificación:** Pregunta primero por el número de personas para la reserva.
2.  **Verifica el límite:** Si son más de 8, informa amablemente sobre la política y dirige al usuario a la web.
3.  **Recopila datos:** Pregunta por la fecha y la hora deseadas.
4.  **Confirma la reserva:** Una vez verificada la disponibilidad, solicita un nombre para finalizar la reserva.
    \`\`\`

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

        // --- Validación de API Key (Preparado para Producción) ---
        // Cambia a 'true' para activar la validación estricta de la API Key en producción.
        const IS_IN_PRODUCTION = false;

        if (IS_IN_PRODUCTION && error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            // Detecta errores comunes relacionados con la API Key para dar un feedback más claro.
            if (errorMessage.includes('api key not valid') || 
                errorMessage.includes('permission denied') || 
                errorMessage.includes('api_key_invalid') ||
                errorMessage.includes('api key is invalid')) {
                throw new Error('Error de Autenticación: La API Key configurada no es válida, ha caducado o no tiene los permisos necesarios. Por favor, contacta al administrador del sistema.');
            }
        }
        
        // --- Mensaje de Error Genérico (Fase Beta o error no relacionado con la Key) ---
        if (error instanceof Error) {
            // Mensaje por defecto mientras la validación estricta no está activa.
            throw new Error(`Ocurrió un error al generar el prompt con IA. Inténtalo de nuevo más tarde.`);
        }
        
        throw new Error("Ocurrió un error desconocido al generar el prompt con IA.");
    }
};