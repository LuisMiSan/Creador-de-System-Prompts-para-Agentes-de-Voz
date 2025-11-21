
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VoiceAgentPromptData, PromptHistoryItem, DynamicVariable, ShareablePromptData, AutoSavedDraft } from './types';
import { generatePerfectPrompt } from './services/geminiService';
import InputField from './components/InputField';
import Spinner from './components/Spinner';
import IconButton from './components/IconButton';
import PromptExamples from './components/PromptExamples';
import SavedPrompts from './components/SavedPrompts';
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
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl bg-emerald-500/10 backdrop-blur-md border border-emerald-500/50 text-emerald-400 transition-all duration-300 ease-in-out
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
        <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl mb-6 text-sm flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4 backdrop-blur-sm">
            <p className="text-blue-200 text-center sm:text-left">
                <span className="font-bold text-blue-400">Borrador detectado.</span> ¿Restaurar contenido no guardado?
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={onRestore}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs shadow-lg shadow-blue-900/20"
                >
                    <RefreshIcon />
                    Restaurar
                </button>
                <button
                    onClick={onDismiss}
                    className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
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
    
    // CRITICAL: This state ensures we don't overwrite localStorage with empty data before loading completes.
    const [isInitialized, setIsInitialized] = useState(false);

    const promptDataRef = useRef(promptData);
    promptDataRef.current = promptData;
    const variablesRef = useRef(variables);
    variablesRef.current = variables;

    
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
        const initializeApp = () => {
            try {
                // 1. ALWAYS Load history first to prevent data loss
                const savedHistory = localStorage.getItem('promptHistory');
                if (savedHistory) {
                    setHistory(JSON.parse(savedHistory));
                }

                // 2. Check for shared prompt in URL
                const hash = window.location.hash;
                if (hash.startsWith('#prompt=')) {
                    try {
                        const encodedData = hash.substring('#prompt='.length);
                        const decodedData = atob(encodedData);
                        const sharedData: Partial<ShareablePromptData> = JSON.parse(decodedData);
                        
                        const initialPromptData = {
                            agentRole: '', personality: '', toneAndLanguage: '', 
                            responseGuidelines: '', task: '', context: '', 
                            stepByStep: '', notes: ''
                        };

                        setPromptData(sharedData.promptData || initialPromptData);
                        setVariables(sharedData.variables || []);
                        setNiche(sharedData.niche || '');
                        setGeneratedPrompt(sharedData.generatedPrompt || '');

                        setToastMessage('¡Prompt compartido cargado con éxito!');
                        setTimeout(() => setToastMessage(''), 3000);

                        // Clean the URL
                        window.history.replaceState(null, '', ' ');
                        
                        // If we loaded from URL, we skip loading autosave draft to avoid conflict
                        return; 
                    } catch (err) {
                        console.error("Error loading shared prompt", err);
                        // If URL load fails, continue to load autosave
                    }
                }

                // 3. Load AutoSave (only if no shared prompt was loaded)
                const savedPrompt = localStorage.getItem('autoSavedPrompt');
                if (savedPrompt) {
                    setAutoSavedData(JSON.parse(savedPrompt));
                }

            } catch (e) { 
                console.error("Failed to load data from localStorage or URL", e); 
            } finally {
                // Mark initialization as complete, allowing saves to occur
                setIsInitialized(true);
            }
        };

        initializeApp();
    }, []);

    // Persist history to localStorage whenever it changes, BUT ONLY after initialization
    useEffect(() => {
        if (!isInitialized) return; // CRITICAL: Prevent saving empty history on initial render before load
        
        try {
            localStorage.setItem('promptHistory', JSON.stringify(history));
        } catch (e) { console.error("Failed to save history to localStorage", e); }
    }, [history, isInitialized]);
    

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

    // Handle variable edits coming from the Markdown Editor (click on {{variable}})
    const handleVariableEditFromEditor = (oldName: string, newName: string, newValue: string) => {
        if (oldName !== newName) {
            const regex = new RegExp(`{{${oldName}}}`, 'g');
            setGeneratedPrompt(prev => prev.replace(regex, `{{${newName}}}`));
        }

        setVariables(prev => {
            const existingIndex = prev.findIndex(v => v.name === oldName);
            
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = { 
                    ...updated[existingIndex], 
                    name: newName, 
                    value: newValue 
                };
                return updated;
            } else {
                return [...prev, { 
                    id: Date.now().toString(), 
                    name: newName, 
                    value: newValue 
                }];
            }
        });
        
        setToastMessage('Variable actualizada');
        setTimeout(() => setToastMessage(''), 2000);
    };


    
    return (
        <div className="min-h-screen bg-deep-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <Toast message={toastMessage} show={!!toastMessage} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} link={shareableLink} />

            <div className="w-full max-w-5xl mx-auto mb-20">
                <header className="relative text-center mb-12 no-print">
                    <div className="flex justify-center items-center gap-3 sm:gap-4 mb-2">
                        <Logo />
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
                            DeepCode
                        </h1>
                    </div>
                    <p className="text-cyan-400 font-mono text-sm uppercase tracking-widest">
                        Open-Source Code Agent Generator
                    </p>
                    <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                        Diseña prompts efectivos para agentes de voz con inteligencia artificial avanzada.
                    </p>
                </header>

                <PromptExamples onSelectExample={handleSelectExample} />

                <main ref={formRef} className="bg-deep-800/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-cyan-900/30 shadow-2xl mt-12 no-print relative overflow-hidden">
                    {/* Decorative top border glow */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

                    {autoSavedData && (
                        <AutoSaveNotification
                            onRestore={handleRestoreAutoSave}
                            onDismiss={handleDismissAutoSave}
                        />
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                                Configuración del Agente
                            </h2>
                            <button
                                type="button"
                                onClick={handleClearForm}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-md transition-colors"
                            >
                                <TrashIcon />
                                Limpiar
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputField
                                    label="Rol del Agente"
                                    value={promptData.agentRole}
                                    onChange={(e) => handleInputChange('agentRole', e.target.value)}
                                    placeholder="Ej: Eres Maria, una asistente virtual amigable..."
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
                                    placeholder="Ej: Proveer información de servicios y cualificar clientes."
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
                                placeholder="Ej: Cercana, espontánea, servicial..."
                                helpText="Define el estilo y la forma de hablar del agente."
                                onMicClick={() => handleMicClick('personality')}
                                isListening={listeningField === 'personality'}
                                micSupported={micSupported}
                            />
                             <InputField
                                label="Tono y Lenguaje"
                                value={promptData.toneAndLanguage}
                                onChange={(e) => handleInputChange('toneAndLanguage', e.target.value)}
                                placeholder="Ej: Formal, usa 'usted', lenguaje técnico..."
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
                                    placeholder="Ej: Servicios: Corte (30€), Tinte (50€). Horario: L-V 10-20h..."
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
                                placeholder="Ej: Sé siempre amable. Usa frases cortas..."
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
                                placeholder="Ej: 1. Saludar. 2. Preguntar nombre. 3. Pedir email..."
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
                                    placeholder="Ej: Evitar temas no relacionados..."
                                    helpText="Reglas específicas o manejo de casos excepcionales."
                                    onMicClick={() => handleMicClick('notes')}
                                    isListening={listeningField === 'notes'}
                                    micSupported={micSupported}
                                />
                            </div>

                             <div className="md:col-span-2 pt-6 border-t border-cyan-900/30">
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

                             <div className="md:col-span-2 pt-6 border-t border-cyan-900/30">
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
                        {error && <p className="text-red-400 text-center mt-4 bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}
                        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isLoading ? <Spinner /> : <SparklesIcon />}
                                {isLoading ? 'Procesando...' : 'Full workflow with indexing enabled'}
                            </button>
                             {generatedPrompt && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleSaveToHistory}
                                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-cyan-900/30 hover:bg-cyan-800/50 border border-cyan-700 text-cyan-300 font-semibold rounded-lg shadow-md transition-colors duration-200"
                                    aria-label="Guardar el prompt actual en el historial"
                                >
                                    <PlusIcon />
                                    Guardar en DB
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
                        <h2 className="text-2xl font-bold text-center mb-4 text-cyan-400 no-print uppercase tracking-wide">
                             System Prompt Generated
                        </h2>
                        <div className="relative bg-deep-900/80 p-6 rounded-xl border border-cyan-900/30 min-h-[150px] shadow-2xl">
                            {/* Header glow strip */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500"></div>
                            
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-32 gap-4">
                                    <Spinner />
                                    <div className="animate-pulse text-cyan-400 font-mono text-sm">AI Agent Processing...</div>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute top-4 right-4 flex gap-2 no-print z-10">
                                        <IconButton
                                            onClick={handleOpenShareModal}
                                            text="Share"
                                            icon={<ShareIcon />}
                                            className="bg-deep-700 hover:bg-deep-700/80 text-gray-300 border border-gray-600/50"
                                        />
                                        <IconButton
                                            onClick={handleCopy}
                                            text={isCopied ? 'Copied' : 'Copy'}
                                            icon={isCopied ? <CheckIcon /> : <CopyIcon />}
                                            className={isCopied ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/50' : 'bg-deep-700 hover:bg-deep-700/80 text-gray-300 border border-gray-600/50'}
                                        />
                                        <IconButton
                                            onClick={handleExportPdf}
                                            text="PDF"
                                            icon={<PdfIcon />}
                                            className="bg-deep-700 hover:bg-deep-700/80 text-gray-300 border border-gray-600/50"
                                        />
                                    </div>
                                    <MarkdownEditor 
                                        value={generatedPrompt} 
                                        onChange={setGeneratedPrompt}
                                        variables={variables}
                                        onVariableUpdate={handleVariableEditFromEditor}
                                    />
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
