import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VoiceAgentPromptData, PromptHistoryItem } from './types';
import { generatePerfectPrompt } from './services/geminiService';
import InputField from './components/InputField';
import Spinner from './components/Spinner';
import IconButton from './components/IconButton';
import HistoryDrawer from './components/HistoryDrawer';
import { CopyIcon, CheckIcon, SparklesIcon, TrashIcon, CloseIcon, RefreshIcon } from './components/Icons';

// Extend the window object with SpeechRecognition
interface CustomWindow extends Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
}
declare const window: CustomWindow;


// --- Toast Notification Component ---
interface ToastProps {
    message: string;
    show: boolean;
}
const Toast: React.FC<ToastProps> = ({ message, show }) => {
    return (
        <div 
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl bg-green-600/80 backdrop-blur-sm border border-green-500 text-white transition-all duration-300 ease-in-out
            ${show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}
        >
            <CheckIcon className="h-5 w-5" />
            <span className="font-semibold text-sm">{message}</span>
        </div>
    );
};


// --- Auto-Save Notification Component ---
interface AutoSaveNotificationProps {
    onRestore: () => void;
    onDismiss: () => void;
}

const AutoSaveNotification: React.FC<AutoSaveNotificationProps> = ({ onRestore, onDismiss }) => {
    return (
        <div className="bg-blue-900/50 border border-blue-700 p-4 rounded-lg mb-6 text-sm flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4">
            <p className="text-blue-200 text-center sm:text-left">
                <span className="font-bold">Hemos encontrado un borrador.</span> ¿Quieres restaurar el contenido que no guardaste?
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={onRestore}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-md transition-colors text-xs"
                >
                    <RefreshIcon />
                    Restaurar
                </button>
                <button
                    onClick={onDismiss}
                    className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Descartar borrador"
                >
                    <CloseIcon />
                </button>
            </div>
        </div>
    );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [promptData, setPromptData] = useState<VoiceAgentPromptData>({
        agentRole: '',
        personality: '',
        toneAndLanguage: '',
        responseGuidelines: '',
        task: '',
        context: '',
        stepByStep: '',
        notes: '',
    });
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [listeningField, setListeningField] = useState<keyof VoiceAgentPromptData | null>(null);
    const [micSupported, setMicSupported] = useState<boolean>(false);
    const recognitionRef = useRef<any | null>(null);
    
    const [history, setHistory] = useState<PromptHistoryItem[]>([]);
    const [toastMessage, setToastMessage] = useState<string>('');

    const [autoSavedData, setAutoSavedData] = useState<VoiceAgentPromptData | null>(null);
    const promptDataRef = useRef(promptData);
    promptDataRef.current = promptData;

    // Auto-save logic
    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentData = promptDataRef.current;
            const isDataEmpty = Object.values(currentData).every(value => value === '');
            
            if (!isDataEmpty) {
                localStorage.setItem('autoSavedPrompt', JSON.stringify(currentData));
            }
        }, 30000); // Save every 30 seconds

        return () => clearInterval(intervalId);
    }, []);

    // Load history and auto-saved prompt on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('promptHistory');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Failed to load history from localStorage", e); }
        
        try {
            const savedPrompt = localStorage.getItem('autoSavedPrompt');
            if (savedPrompt) setAutoSavedData(JSON.parse(savedPrompt));
        } catch (e) { console.error("Failed to load auto-saved prompt from localStorage", e); }
    }, []);

    // Persist history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('promptHistory', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save history to localStorage", e);
        }
    }, [history]);

    // Speech Recognition Setup
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setMicSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.lang = 'es-ES';
            recognition.interimResults = true;

            recognition.onresult = (event: any) => {
                 let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (listeningField && finalTranscript) {
                    setPromptData(prev => ({
                        ...prev,
                        [listeningField]: (prev[listeningField] ? prev[listeningField] + ' ' : '') + finalTranscript
                    }));
                }
            };
            recognition.onerror = (event: any) => { console.error('Speech recognition error', event.error); setListeningField(null); };
            recognition.onend = () => { if (listeningField) { setListeningField(null); } };
            recognitionRef.current = recognition;
        } else {
            setMicSupported(false);
        }
    }, [listeningField]);


    const handleInputChange = useCallback((field: keyof VoiceAgentPromptData, value: string) => {
        setPromptData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleMicClick = (field: keyof VoiceAgentPromptData) => {
        if (!recognitionRef.current) return;
        if (listeningField === field) {
            recognitionRef.current.stop();
            setListeningField(null);
        } else {
            if (listeningField) { recognitionRef.current.stop(); }
            setListeningField(field);
            recognitionRef.current.start();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const trimmedRole = promptData.agentRole.trim();
        const trimmedTask = promptData.task.trim();
        const minLength = 3;

        if (trimmedRole.length < minLength) {
            setError(`El campo 'Rol del Agente' es obligatorio y debe tener al menos ${minLength} caracteres.`);
            return;
        }

        if (trimmedTask.length < minLength) {
            setError(`El campo 'Tarea Principal' es obligatorio y debe tener al menos ${minLength} caracteres.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedPrompt('');
        try {
            const perfectPrompt = await generatePerfectPrompt(promptData);
            setGeneratedPrompt(perfectPrompt);
            const newHistoryItem: PromptHistoryItem = {
                id: new Date().toISOString(),
                promptData,
                generatedPrompt: perfectPrompt,
                timestamp: Date.now(),
            };
            setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
            setToastMessage('Prompt guardado en la base de datos');
            setTimeout(() => setToastMessage(''), 3000);

            // Clear auto-saved data on successful submission
            localStorage.removeItem('autoSavedPrompt');
            setAutoSavedData(null);
        } catch (err) {
            const errorMessage = (err as Error).message;
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (generatedPrompt) {
            navigator.clipboard.writeText(generatedPrompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleSelectHistoryItem = (item: PromptHistoryItem) => {
        setPromptData(item.promptData);
        setGeneratedPrompt(item.generatedPrompt);
    };

    const handleClearHistory = () => {
        if (window.confirm('¿Estás seguro de que quieres borrar todos los prompts guardados? Esta acción no se puede deshacer.')) {
            setHistory([]);
        }
    };

    const handleRestoreAutoSave = () => {
        if (autoSavedData) {
            setPromptData(autoSavedData);
            setAutoSavedData(null);
        }
    };

    const handleDismissAutoSave = () => {
        localStorage.removeItem('autoSavedPrompt');
        setAutoSavedData(null);
    };

    const handleClearForm = () => {
        setPromptData({
            agentRole: '', personality: '', toneAndLanguage: '', responseGuidelines: '',
            task: '', context: '', stepByStep: '', notes: '',
        });
        setGeneratedPrompt('');
        setError(null);
        localStorage.removeItem('autoSavedPrompt');
        setAutoSavedData(null);
    };
    
    // --- Export Handlers ---
    const createDownloadLink = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportMarkdown = () => {
        if (history.length === 0) {
            setToastMessage('No hay nada que exportar.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }
        const markdownContent = history.map(item => {
            const { promptData, generatedPrompt, timestamp } = item;
            const date = new Date(timestamp).toLocaleString('es-ES');

            return `
# Prompt Creado el ${date}
---

## 📥 Datos de Entrada

- **Rol del Agente:** ${promptData.agentRole || 'N/A'}
- **Tarea Principal:** ${promptData.task || 'N/A'}
- **Personalidad:** ${promptData.personality || 'N/A'}
- **Tono y Lenguaje:** ${promptData.toneAndLanguage || 'N/A'}
- **Contexto:** ${promptData.context || 'N/A'}
- **Directrices de Respuesta:** ${promptData.responseGuidelines || 'N/A'}
- **Flujo de Conversación:** ${promptData.stepByStep || 'N/A'}
- **Notas Adicionales:** ${promptData.notes || 'N/A'}

## 💡 Prompt Generado

\`\`\`markdown
${generatedPrompt}
\`\`\`
`;
        }).join('\n\n---\n\n');

        const blob = new Blob([markdownContent.trim()], { type: 'text/markdown' });
        createDownloadLink(blob, 'prompts_historial.md');
    };

    const handleExportPdf = () => {
        if (history.length === 0) {
            setToastMessage('No hay nada que exportar.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }
        
        const htmlContent = `
          <html>
            <head>
              <title>Historial de Prompts</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
                .prompt-item { page-break-inside: avoid; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                h1 { text-align: center; color: #111; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }
                h2 { color: #444; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                h3 { color: #555; }
                pre { background-color: #f6f8fa; padding: 16px; overflow: auto; font-size: 90%; line-height: 1.45; border-radius: 6px; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #e1e4e8; }
                .meta-data { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #eee; }
                .meta-data p { margin: 5px 0; }
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; }
                    .prompt-item { box-shadow: none; border: 1px solid #ccc; }
                }
              </style>
            </head>
            <body>
              <h1>Historial de Prompts</h1>
              ${history.map(item => {
                  const { promptData, generatedPrompt, timestamp } = item;
                  const date = new Date(timestamp).toLocaleString('es-ES');
                  const escapeHtml = (unsafe) => unsafe
                     .replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/"/g, "&quot;")
                     .replace(/'/g, "&#039;");
                  
                  return `
                    <div class="prompt-item">
                      <h2>Prompt del ${date}</h2>
                      <div class="meta-data">
                        <p><strong>Rol del Agente:</strong> ${escapeHtml(promptData.agentRole || 'N/A')}</p>
                        <p><strong>Tarea Principal:</strong> ${escapeHtml(promptData.task || 'N/A')}</p>
                        <p><strong>Personalidad:</strong> ${escapeHtml(promptData.personality || 'N/A')}</p>
                        <p><strong>Tono y Lenguaje:</strong> ${escapeHtml(promptData.toneAndLanguage || 'N/A')}</p>
                        <p><strong>Contexto:</strong> ${escapeHtml(promptData.context || 'N/A')}</p>
                        <p><strong>Directrices de Respuesta:</strong> ${escapeHtml(promptData.responseGuidelines || 'N/A')}</p>
                        <p><strong>Flujo de Conversación:</strong> ${escapeHtml(promptData.stepByStep || 'N/A')}</p>
                        <p><strong>Notas Adicionales:</strong> ${escapeHtml(promptData.notes || 'N/A')}</p>
                      </div>
                      <h3>Prompt Generado:</h3>
                      <pre>${escapeHtml(generatedPrompt)}</pre>
                    </div>
                  `;
              }).join('')}
            </body>
          </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } else {
            alert('Por favor, permite las ventanas emergentes para imprimir el PDF.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <Toast message={toastMessage} show={!!toastMessage} />
            <div className="w-full max-w-4xl mx-auto mb-40"> {/* Add margin-bottom to avoid overlap with drawer */}
                <header className="text-center mb-8 relative">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                        Creador de System Prompts para Agentes de Voz
                    </h1>
                    <p className="mt-2 text-lg text-gray-400">
                        Diseña prompts efectivos para IA de voz en plataformas como Retell y Vapi.
                    </p>
                </header>

                <main className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
                    {autoSavedData && (
                        <AutoSaveNotification
                            onRestore={handleRestoreAutoSave}
                            onDismiss={handleDismissAutoSave}
                        />
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-300">Detalles del Prompt</h2>
                            <button
                                type="button"
                                onClick={handleClearForm}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-red-900/50 text-gray-300 hover:text-red-300 rounded-md transition-colors"
                            >
                                <TrashIcon />
                                Limpiar Formulario
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputField
                                    label="Rol del Agente"
                                    value={promptData.agentRole}
                                    onChange={(e) => handleInputChange('agentRole', e.target.value)}
                                    placeholder="Ej: Eres Maria, una asistente virtual amigable de la peluquería IA360..."
                                    helpText="Describe quién es el agente y su propósito principal. (Obligatorio)"
                                    required
                                    onMicClick={() => handleMicClick('agentRole')}
                                    isListening={listeningField === 'agentRole'}
                                    micSupported={micSupported}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <InputField
                                    label="Tarea Principal"
                                    value={promptData.task}
                                    onChange={(e) => handleInputChange('task', e.target.value)}
                                    placeholder="Ej: Proveer información de servicios y cualificar clientes potenciales."
                                    helpText="El objetivo clave que el agente debe cumplir. (Obligatorio)"
                                    required
                                    onMicClick={() => handleMicClick('task')}
                                    isListening={listeningField === 'task'}
                                    micSupported={micSupported}
                                />
                            </div>
                            <InputField
                                label="Personalidad"
                                value={promptData.personality}
                                onChange={(e) => handleInputChange('personality', e.target.value)}
                                placeholder="Ej: Cercana, espontánea, con acento español, servicial..."
                                helpText="Define el estilo y la forma de hablar del agente."
                                onMicClick={() => handleMicClick('personality')}
                                isListening={listeningField === 'personality'}
                                micSupported={micSupported}
                            />
                             <InputField
                                label="Tono y Lenguaje"
                                value={promptData.toneAndLanguage}
                                onChange={(e) => handleInputChange('toneAndLanguage', e.target.value)}
                                placeholder="Ej: Formal, usa 'usted', lenguaje técnico y preciso..."
                                helpText="Especifica el tono y las reglas del lenguaje a usar."
                                onMicClick={() => handleMicClick('toneAndLanguage')}
                                isListening={listeningField === 'toneAndLanguage'}
                                micSupported={micSupported}
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label="Contexto (Base de Conocimiento)"
                                    value={promptData.context}
                                    onChange={(e) => handleInputChange('context', e.target.value)}
                                    placeholder="Ej: Servicios: Corte (30€), Tinte (50€). Horario: L-V 10-20h. Ubicación: C/ Falsa 123, Madrid."
                                    helpText="Toda la información que el agente necesita para responder preguntas."
                                    isTextarea
                                    onMicClick={() => handleMicClick('context')}
                                    isListening={listeningField === 'context'}
                                    micSupported={micSupported}
                                />
                            </div>
                            <InputField
                                label="Directrices de Respuesta"
                                value={promptData.responseGuidelines}
                                onChange={(e) => handleInputChange('responseGuidelines', e.target.value)}
                                placeholder="Ej: Sé siempre amable. Usa frases cortas. Si no sabes algo, di 'No tengo esa información'."
                                helpText="Reglas sobre cómo deben ser las respuestas del agente."
                                isTextarea
                                onMicClick={() => handleMicClick('responseGuidelines')}
                                isListening={listeningField === 'responseGuidelines'}
                                micSupported={micSupported}
                            />
                            <InputField
                                label="Flujo de Conversación (Paso a Paso)"
                                value={promptData.stepByStep}
                                onChange={(e) => handleInputChange('stepByStep', e.target.value)}
                                placeholder="Ej: 1. Saludar y preguntar nombre. 2. Realizar preguntas de cualificación. 3. Pedir email..."
                                helpText="Define un guion o los pasos que el agente debe seguir."
                                isTextarea
                                onMicClick={() => handleMicClick('stepByStep')}
                                isListening={listeningField === 'stepByStep'}
                                micSupported={micSupported}
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label="Notas Adicionales"
                                    value={promptData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Ej: Evitar temas no relacionados, si preguntan por 'Rita' decir que está ocupada..."
                                    helpText="Reglas específicas o manejo de casos excepcionales."
                                    onMicClick={() => handleMicClick('notes')}
                                    isListening={listeningField === 'notes'}
                                    micSupported={micSupported}
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                        <div className="mt-8 flex justify-center">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isLoading ? <Spinner /> : <SparklesIcon />}
                                {isLoading ? 'Generando...' : 'Crear System Prompt'}
                            </button>
                        </div>
                    </form>

                    {(isLoading || generatedPrompt) && (
                        <div className="mt-10">
                            <h2 className="text-2xl font-semibold text-center mb-4 text-gray-300">Tu System Prompt Optimizado</h2>
                            <div className="relative bg-gray-900/70 p-6 rounded-lg border border-gray-700 min-h-[150px] whitespace-pre-wrap font-mono text-sm">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-pulse text-gray-500">Analizando y construyendo...</div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute top-2 right-2">
                                            <IconButton
                                                onClick={handleCopy}
                                                text={isCopied ? 'Copiado' : 'Copiar'}
                                                icon={isCopied ? <CheckIcon /> : <CopyIcon />}
                                                className={isCopied ? 'bg-green-600/30 text-green-300' : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'}
                                            />
                                        </div>
                                        <p>{generatedPrompt}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <HistoryDrawer
                history={history}
                onSelect={handleSelectHistoryItem}
                onClear={handleClearHistory}
                onExportMarkdown={handleExportMarkdown}
                onExportPdf={handleExportPdf}
            />
        </div>
    );
};

export default App;