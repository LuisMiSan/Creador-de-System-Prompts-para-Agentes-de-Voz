
import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Removed ApiKey as it's no longer needed after removing the API key management UI.
import { VoiceAgentPromptData, PromptHistoryItem, DynamicVariable, ShareablePromptData, AutoSavedDraft } from './types';
import { generatePerfectPrompt } from './services/geminiService';
import InputField from './components/InputField';
import Spinner from './components/Spinner';
import IconButton from './components/IconButton';
import PromptExamples from './components/PromptExamples';
import SavedPrompts from './components/SavedPrompts';
// FIX: Removed ApiKeyManager as API key management via UI is against the guidelines.
import { CopyIcon, CheckIcon, SparklesIcon, TrashIcon, CloseIcon, RefreshIcon, PlusIcon, PdfIcon, ShareIcon } from './components/Icons';
import Logo from './components/Logo';
import DynamicVariables from './components/DynamicVariables';
import MarkdownEditor from './components/MarkdownEditor';
import ShareModal from './components/ShareModal';

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
    const [variables, setVariables] = useState<DynamicVariable[]>([]);
    const [niche, setNiche] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [listeningField, setListeningField] = useState<string | null>(null);
    const [micSupported, setMicSupported] = useState<boolean>(false);
    const recognitionRef = useRef<any | null>(null);
    const formRef = useRef<HTMLDivElement>(null);
    
    const [history, setHistory] = useState<PromptHistoryItem[]>([]);
    const [toastMessage, setToastMessage] = useState('');

    const [autoSavedData, setAutoSavedData] = useState<AutoSavedDraft | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareableLink, setShareableLink] = useState('');
    
    const promptDataRef = useRef(promptData);
    promptDataRef.current = promptData;
    const variablesRef = useRef(variables);
    variablesRef.current = variables;

    // FIX: Removed API Key Management State as per guidelines.
    
    // Auto-save logic
    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentData = promptDataRef.current;
            const currentVariables = variablesRef.current;
            const isDataEmpty = Object.values(currentData).every(value => value === '');
            const areVariablesEmpty = currentVariables.length === 0;

            if (!isDataEmpty || !areVariablesEmpty) {
                localStorage.setItem('autoSavedPrompt', JSON.stringify({ promptData: currentData, variables: currentVariables }));
            }
        }, 10000); // Save every 10 seconds for better data safety

        return () => clearInterval(intervalId);
    }, []);

    // Load history, auto-saved prompt, and API keys on initial render
    useEffect(() => {
        try {
             // Load shared prompt from URL first
            const hash = window.location.hash;
            if (hash.startsWith('#prompt=')) {
                const encodedData = hash.substring('#prompt='.length);
                const decodedData = atob(encodedData);
                const sharedData: ShareablePromptData = JSON.parse(decodedData);
                
                setPromptData(sharedData.promptData);
                setVariables(sharedData.variables || []);
                setNiche(sharedData.niche);
                setGeneratedPrompt(sharedData.generatedPrompt);

                setToastMessage('¡Prompt compartido cargado con éxito!');
                setTimeout(() => setToastMessage(''), 3000);

                // Clean the URL
                window.history.replaceState(null, '', ' ');
                return; // Don't load local data if we loaded from a share link
            }

            const savedHistory = localStorage.getItem('promptHistory');
            if (savedHistory) setHistory(JSON.parse(savedHistory));

            const savedPrompt = localStorage.getItem('autoSavedPrompt');
            if (savedPrompt) setAutoSavedData(JSON.parse(savedPrompt));
            // FIX: Removed loading API keys from localStorage.

        } catch (e) { console.error("Failed to load data from localStorage or URL", e); }
    }, []);

    // Persist history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('promptHistory', JSON.stringify(history));
        } catch (e) { console.error("Failed to save history to localStorage", e); }
    }, [history]);
    
    // FIX: Removed useEffect for persisting API keys.

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
                    if (listeningField in promptDataRef.current) {
                        setPromptData(prev => ({
                            ...prev,
                            [listeningField]: (prev[listeningField as keyof VoiceAgentPromptData] ? prev[listeningField as keyof VoiceAgentPromptData] + ' ' : '') + finalTranscript
                        }));
                    } else if (listeningField === 'niche') {
                        setNiche(prev => (prev ? prev + ' ' : '') + finalTranscript);
                    } else if (listeningField.startsWith('variable-')) {
                        const [, field, id] = listeningField.split('-');
                        setVariables(prevVars => prevVars.map(v => {
                            if (v.id === id) {
                                if (field === 'name') {
                                    const newValue = (v.name + finalTranscript).replace(/[^a-zA-Z0-9_]/g, '');
                                    return { ...v, name: newValue };
                                }
                                if (field === 'value') {
                                    const newValue = (v.value ? v.value + ' ' : '') + finalTranscript;
                                    return { ...v, value: newValue };
                                }
                            }
                            return v;
                        }));
                    }
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

    const handleMicClick = (field: string) => {
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
    
    const handleSelectExample = (data: VoiceAgentPromptData) => {
        setPromptData(data);
        setGeneratedPrompt('');
        setNiche('');
        setError(null);
        setVariables([]);
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
        setToastMessage('Plantilla cargada. ¡Ya puedes editarla!');
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleSaveToHistory = () => {
        const trimmedNiche = niche.trim();
        const minLength = 3;

        if (trimmedNiche.length < minLength) {
            setError(`El campo 'Nicho del Prompt' es obligatorio y debe tener al menos ${minLength} caracteres.`);
            return;
        }
        
        if (!generatedPrompt) {
            setError("No hay ningún prompt generado para guardar.");
            return;
        }
        setError(null);

        const newHistoryItem: PromptHistoryItem = {
            id: new Date().toISOString(),
            promptData,
            generatedPrompt,
            timestamp: Date.now(),
            niche: trimmedNiche,
            variables,
        };
        
        const isDuplicate = history.some(item => 
            item.generatedPrompt === newHistoryItem.generatedPrompt && 
            JSON.stringify(item.promptData) === JSON.stringify(newHistoryItem.promptData) &&
            item.niche === newHistoryItem.niche
        );

        if (isDuplicate) {
            setToastMessage('Este prompt ya está en tu historial.');
            setTimeout(() => setToastMessage(''), 3000);
            return;
        }

        setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
        setToastMessage('Prompt guardado en la base de datos');
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // FIX: Removed API key validation. The key is now sourced from environment variables.
        
        const trimmedRole = promptData.agentRole.trim();
        const trimmedTask = promptData.task.trim();
        const trimmedNiche = niche.trim();
        const minLength = 3;

        if (trimmedRole.length < minLength) {
            setError(`El campo 'Rol del Agente' es obligatorio y debe tener al menos ${minLength} caracteres.`);
            return;
        }

        if (trimmedTask.length < minLength) {
            setError(`El campo 'Tarea Principal' es obligatorio y debe tener al menos ${minLength} caracteres.`);
            return;
        }
        
        if (trimmedNiche.length < minLength) {
            setError(`El campo 'Nicho del Prompt' es obligatorio y debe tener al menos ${minLength} caracteres.`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedPrompt('');

        // Substitute variables before sending to the API
        const substitutedPromptData = { ...promptData };
        for (const variable of variables) {
            if (variable.name) {
                const regex = new RegExp(`{{${variable.name}}}`, 'g');
                for (const key in substitutedPromptData) {
                    substitutedPromptData[key as keyof VoiceAgentPromptData] = 
                        substitutedPromptData[key as keyof VoiceAgentPromptData].replace(regex, variable.value);
                }
            }
        }


        try {
            // FIX: Removed passing the API key, as it's now handled by the geminiService.
            const perfectPrompt = await generatePerfectPrompt(substitutedPromptData);
            setGeneratedPrompt(perfectPrompt);
            const newHistoryItem: PromptHistoryItem = {
                id: new Date().toISOString(),
                promptData,
                generatedPrompt: perfectPrompt,
                timestamp: Date.now(),
                niche: trimmedNiche,
                variables,
            };
            setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
            setToastMessage('Prompt guardado en la base de datos');
            setTimeout(() => setToastMessage(''), 3000);

            // Clear auto-saved data on successful submission
            localStorage.removeItem('autoSavedPrompt');
            setAutoSavedData(null);
            setNiche('');

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

    const handleExportPdf = () => {
        const printArea = document.getElementById('generated-prompt-print-area');
        if (!printArea) return;

        printArea.classList.add('print-section');

        const afterPrint = () => {
            printArea.classList.remove('print-section');
            window.removeEventListener('afterprint', afterPrint);
        };
        window.addEventListener('afterprint', afterPrint);
        
        window.print();
    };

    const handleOpenShareModal = () => {
        if (!generatedPrompt) return;

        try {
            const shareData: ShareablePromptData = {
                promptData,
                generatedPrompt,
                niche,
                variables,
            };
            const jsonString = JSON.stringify(shareData);
            const encodedData = btoa(jsonString);
            const url = `${window.location.href.split('#')[0]}#prompt=${encodedData}`;

            setShareableLink(url);
            setIsShareModalOpen(true);
        } catch (error) {
            console.error("Error creating share link:", error);
            setError("No se pudo crear el enlace para compartir.");
        }
    };

    const handleSelectHistoryItem = (item: PromptHistoryItem) => {
        setPromptData(item.promptData);
        setGeneratedPrompt(item.generatedPrompt);
        setNiche(item.niche);
        setVariables(item.variables || []);
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteHistoryItem = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres borrar este prompt?')) {
            setHistory(prev => prev.filter(item => item.id !== id));
            setToastMessage('Prompt eliminado.');
            setTimeout(() => setToastMessage(''), 3000);
        }
    };

    const handleRestoreAutoSave = () => {
        if (autoSavedData) {
            setPromptData(autoSavedData.promptData);
            setVariables(autoSavedData.variables || []);
            setAutoSavedData(null);
            localStorage.removeItem('autoSavedPrompt');
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
        setNiche('');
        setGeneratedPrompt('');
        setError(null);
        setVariables([]);
        localStorage.removeItem('autoSavedPrompt');
        setAutoSavedData(null);
    };

    // --- Dynamic Variable Handlers ---
    const handleAddVariable = () => {
        setVariables(prev => [...prev, { id: Date.now().toString(), name: '', value: '' }]);
    };

    const handleUpdateVariable = (id: string, field: 'name' | 'value', fieldValue: string) => {
        setVariables(prev => prev.map(v => v.id === id ? { ...v, [field]: fieldValue } : v));
    };
    
    const handleDeleteVariable = (id: string) => {
        setVariables(prev => prev.filter(v => v.id !== id));
    };


    // --- FIX: Removed API Key Handlers ---
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <Toast message={toastMessage} show={!!toastMessage} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} link={shareableLink} />
            {/* FIX: Removed ApiKeyManager component to comply with guidelines. */}

            <div className="w-full max-w-5xl mx-auto mb-20">
                <header className="relative text-center mb-12 no-print">
                     {/* FIX: Removed the settings button for API key management. */}
                    <div className="flex justify-center items-center gap-3 sm:gap-4">
                        <Logo />
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                            VoxWizard IA
                        </h1>
                    </div>
                    <p className="mt-4 text-lg text-gray-400">
                        Diseña prompts efectivos para IA de voz en plataformas como Retell y Vapi.
                    </p>
                </header>

                <PromptExamples onSelectExample={handleSelectExample} />

                <main ref={formRef} className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 mt-12 no-print">
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
                                // FIX: Corrected onMicClick handler. It was incorrectly calling handleInputChange which caused a reference error because 'e' was not defined. It should call handleMicClick to manage the microphone state.
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

                             <div className="md:col-span-2 pt-4 border-t border-gray-700">
                                <InputField
                                    label="Nicho del Prompt"
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    placeholder="Ej: Peluquería, Inmobiliaria, Restaurante..."
                                    helpText="Categoriza este prompt para encontrarlo fácilmente. (Obligatorio)"
                                    required
                                    onMicClick={() => handleMicClick('niche')}
                                    isListening={listeningField === 'niche'}
                                    micSupported={micSupported}
                                />
                            </div>

                             <div className="md:col-span-2 pt-4 border-t border-gray-700">
                                <DynamicVariables 
                                    variables={variables}
                                    onAdd={handleAddVariable}
                                    onUpdate={handleUpdateVariable}
                                    onDelete={handleDeleteVariable}
                                    onMicClick={handleMicClick}
                                    listeningField={listeningField}
                                    micSupported={micSupported}
                                />
                            </div>

                        </div>
                        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isLoading ? <Spinner /> : <SparklesIcon />}
                                {isLoading ? 'Generando...' : 'Crear y Guardar Prompt'}
                            </button>
                             {generatedPrompt && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleSaveToHistory}
                                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
                                    aria-label="Guardar el prompt actual en el historial"
                                >
                                    <PlusIcon />
                                    Guardar en Historial
                                </button>
                            )}
                        </div>
                    </form>
                </main>
                
                {(isLoading || generatedPrompt) && (
                    <div id="generated-prompt-print-area" className="mt-10">
                         <div className="print-header-content hidden">
                            <h2>System Prompt Optimizado</h2>
                        </div>
                        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-300 no-print">Tu System Prompt Optimizado</h2>
                        <div className="relative bg-gray-900/70 p-6 rounded-lg border border-gray-700 min-h-[150px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-pulse text-gray-500">Analizando y construyendo...</div>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute top-2 right-2 flex gap-2 no-print">
                                        <IconButton
                                            onClick={handleOpenShareModal}
                                            text="Compartir"
                                            icon={<ShareIcon />}
                                            className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
                                        />
                                        <IconButton
                                            onClick={handleCopy}
                                            text={isCopied ? 'Copiado' : 'Copiar'}
                                            icon={isCopied ? <CheckIcon /> : <CopyIcon />}
                                            className={isCopied ? 'bg-green-600/30 text-green-300' : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300'}
                                        />
                                        <IconButton
                                            onClick={handleExportPdf}
                                            text="Exportar PDF"
                                            icon={<PdfIcon />}
                                            className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300"
                                        />
                                    </div>
                                    <MarkdownEditor value={generatedPrompt} onChange={setGeneratedPrompt} />
                                </>
                            )}
                        </div>
                    </div>
                )}


                <SavedPrompts 
                    history={history}
                    onSelect={handleSelectHistoryItem}
                    onDelete={handleDeleteHistoryItem}
                />
            </div>
        </div>
    );
};

export default App;
