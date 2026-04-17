
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VoiceAgentPromptData, PromptHistoryItem, DynamicVariable, ShareablePromptData, AutoSavedDraft } from './types';
import { generatePerfectPrompt, generateSuggestions } from './services/geminiService';
import InputField from './components/InputField';
import Spinner from './components/Spinner';
import IconButton from './components/IconButton';
import PromptExamples from './components/PromptExamples';
import SavedPrompts from './components/SavedPrompts';
import { CopyIcon, CheckIcon, SparklesIcon, TrashIcon, CloseIcon, RefreshIcon, PlusIcon, PdfIcon, ShareIcon, LanguageIcon, DownloadIcon } from './components/Icons';
import Logo from './components/Logo';
import DynamicVariables from './components/DynamicVariables';
import MarkdownEditor from './components/MarkdownEditor';
import ShareModal from './components/ShareModal';
import SuggestionModal from './components/SuggestionModal';
import { translations, Language } from './translations';
// Import PDF libraries
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
            className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl bg-white border border-emerald-500/20 text-emerald-600 transition-all duration-300 ease-in-out
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
    lang: Language;
}

const AutoSaveNotification: React.FC<AutoSaveNotificationProps> = ({ onRestore, onDismiss, lang }) => {
    const t = translations[lang];
    return (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 text-sm flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
            <p className="text-blue-800 text-center sm:text-left">
                <span className="font-bold text-blue-600">{t.draftDetected}</span> {t.restoreDraft}
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={onRestore}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs shadow-md"
                >
                    <RefreshIcon />
                    {t.restoreBtn}
                </button>
                <button
                    onClick={onDismiss}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
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
    const [language, setLanguage] = useState<Language>('es');

    // Project Management State
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    // Suggestions State
    const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
    const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSuggestionField, setActiveSuggestionField] = useState<'responseGuidelines' | 'stepByStep' | 'notes' | null>(null);

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
    
    const t = translations[language];

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'es' ? 'en' : 'es');
    };

    
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
                    const parsedHistory = JSON.parse(savedHistory);
                    if (Array.isArray(parsedHistory)) {
                        setHistory(parsedHistory);
                    }
                }

                // 2. Check for shared prompt in URL
                const hash = window.location.hash;
                if (hash.startsWith('#prompt=')) {
                    try {
                        const encodedData = hash.substring('#prompt='.length);
                        // Security: Check payload size (limit to ~50KB to avoid extreme memory usage)
                        if (encodedData.length > 50000) {
                             throw new Error("Payload too large");
                        }

                        // Fix for Unicode decoding
                        const decodedData = decodeURIComponent(escape(atob(encodedData)));
                        const sharedData: any = JSON.parse(decodedData);
                        
                        // Validation: Ensure the basic structure exists and is safe
                        if (!sharedData || typeof sharedData !== 'object') {
                            throw new Error("Invalid structure");
                        }

                        // Basic structural mapping and sanitization
                        const sanitizedPromptData = {
                            agentRole: String(sharedData.promptData?.agentRole || '').substring(0, 2000),
                            personality: String(sharedData.promptData?.personality || '').substring(0, 2000),
                            toneAndLanguage: String(sharedData.promptData?.toneAndLanguage || '').substring(0, 2000),
                            responseGuidelines: String(sharedData.promptData?.responseGuidelines || '').substring(0, 5000),
                            task: String(sharedData.promptData?.task || '').substring(0, 5000),
                            context: String(sharedData.promptData?.context || '').substring(0, 10000),
                            stepByStep: String(sharedData.promptData?.stepByStep || '').substring(0, 5000),
                            notes: String(sharedData.promptData?.notes || '').substring(0, 5000),
                        };

                        setPromptData(sanitizedPromptData);
                        setVariables(Array.isArray(sharedData.variables) ? sharedData.variables.slice(0, 20).map((v: any) => ({
                            id: String(v.id || Date.now()),
                            name: String(v.name || '').replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50),
                            value: String(v.value || '').substring(0, 1000)
                        })) : []);
                        setNiche(String(sharedData.niche || '').substring(0, 100));
                        setGeneratedPrompt(String(sharedData.generatedPrompt || '').substring(0, 20000));
                        setCurrentProjectId(null); // Shared prompts are new by default

                        const msgs = translations[language];
                        setToastMessage(msgs.toastSharedLoaded);
                        setTimeout(() => setToastMessage(''), 3000);

                        // Clean the URL
                        window.history.replaceState(null, '', ' ');
                        
                        // If we loaded from URL, we skip loading autosave draft to avoid conflict
                        return; 
                    } catch (err) {
                        console.error("Error loading shared prompt", err);
                        const msgs = translations[language];
                        setError(msgs.errorInvalidShareData);
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
            recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
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
    }, [listeningField, language]);


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
        setCurrentProjectId(null); // Templates are new projects
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
        setToastMessage(t.toastTemplateLoaded);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleSaveProject = () => {
        const trimmedNiche = niche.trim();
        const minLength = 3;

        if (trimmedNiche.length < minLength) {
            setError(t.errorFieldRequired.replace('{0}', t.nicheLabel).replace('{1}', minLength.toString()));
            return;
        }
        
        if (!generatedPrompt) {
            setError(t.errorNoPrompt);
            return;
        }
        setError(null);

        // CHECK IF WE ARE UPDATING AN EXISTING PROJECT
        if (currentProjectId) {
            // Update logic
            setHistory(prevHistory => prevHistory.map(item => {
                if (item.id === currentProjectId) {
                    return {
                        ...item,
                        promptData,
                        generatedPrompt,
                        timestamp: Date.now(),
                        niche: trimmedNiche,
                        variables
                    };
                }
                return item;
            }));
            setToastMessage(t.toastUpdatedDB);
        } else {
            // Create new project logic
            // Check for duplicate names only when creating new
            const isDuplicate = history.some(item => 
                item.niche.toLowerCase() === trimmedNiche.toLowerCase()
            );

            if (isDuplicate) {
                setToastMessage(t.toastDuplicate);
                setTimeout(() => setToastMessage(''), 3000);
                return;
            }

            const newId = new Date().toISOString();
            const newHistoryItem: PromptHistoryItem = {
                id: newId,
                promptData,
                generatedPrompt,
                timestamp: Date.now(),
                niche: trimmedNiche,
                variables,
            };

            setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
            setCurrentProjectId(newId); // Set as current project
            setToastMessage(t.toastSavedDB);
        }
        
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        
        const trimmedRole = promptData.agentRole.trim();
        const trimmedTask = promptData.task.trim();
        const trimmedNiche = niche.trim();
        const minLength = 3;

        if (trimmedRole.length < minLength) {
            setError(t.errorFieldRequired.replace('{0}', t.roleLabel).replace('{1}', minLength.toString()));
            return;
        }

        if (trimmedTask.length < minLength) {
            setError(t.errorFieldRequired.replace('{0}', t.taskLabel).replace('{1}', minLength.toString()));
            return;
        }
        
        if (trimmedNiche.length < minLength) {
            setError(t.errorFieldRequired.replace('{0}', t.nicheLabel).replace('{1}', minLength.toString()));
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
            
            // NOTE: Auto-save logic removed. The user must manually click "Save to DB".
            // This prevents duplication conflicts when clicking the save button immediately after generation.

            // Clear auto-saved data on successful submission
            localStorage.removeItem('autoSavedPrompt');
            setAutoSavedData(null);
            // We do NOT clear niche here anymore to allow the user to save with the current niche
            
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

    const handleDownloadMarkdown = () => {
        if (!generatedPrompt) return;
        
        try {
            const blob = new Blob([generatedPrompt], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompt-${(niche || 'agent').replace(/\s+/g, '-').toLowerCase()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setToastMessage(t.toastDownloadingMD);
            setTimeout(() => setToastMessage(''), 2000);
        } catch (e) {
            console.error("Download failed", e);
            setError(t.errorDownload);
        }
    };

    const handleExportPdf = async () => {
        // Target specifically the rendered content div within the editor
        // We look for the class 'prompt-content-for-print' added in MarkdownEditor.tsx
        const content = document.querySelector('#generated-prompt-print-area .prompt-content-for-print') as HTMLElement;
        
        if (!content) {
            console.error("No content found for PDF");
            setToastMessage(t.errorNoPDFContent);
            return;
        }

        setToastMessage(t.toastGeneratingPDF);

        try {
            // 1. Capture the DOM element as a canvas
            const canvas = await html2canvas(content, {
                scale: 2, // Improve resolution
                backgroundColor: '#ffffff', // Force white background
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            
            // 2. Calculate PDF dimensions
            // We'll create a PDF that fits the content exactly (like a digital receipt or long document)
            // instead of splitting into A4 pages which cuts text.
            const imgWidth = 210; // A4 width in mm
            const pageHeight = (canvas.height * imgWidth) / canvas.width;
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [imgWidth, pageHeight] // Custom height based on content
            });

            // 3. Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);

            // 4. Save
            const fileName = `prompt-${(niche || 'agent').replace(/\s+/g, '-').toLowerCase()}.pdf`;
            pdf.save(fileName);
            
            setToastMessage(t.toastPDFDownloaded);

        } catch (err) {
            console.error("PDF Generation failed:", err);
            setError(t.errorPDFGen);
            setToastMessage(t.errorPDFGen);
        }
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
            
            // Fix for Unicode encoding: encode to UTF-8 then base64
            const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
            const url = `${window.location.href.split('#')[0]}#prompt=${encodedData}`;

            setShareableLink(url);
            setIsShareModalOpen(true);
        } catch (error) {
            console.error("Error creating share link:", error);
            setError(t.errorShareLink);
        }
    };

    const handleSelectHistoryItem = (item: PromptHistoryItem) => {
        setPromptData(item.promptData);
        setGeneratedPrompt(item.generatedPrompt);
        setNiche(item.niche);
        setVariables(item.variables || []);
        setCurrentProjectId(item.id); // Set as current project being edited
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteHistoryItem = (id: string) => {
        if (window.confirm(t.confirmDelete)) {
            setHistory(prev => prev.filter(item => item.id !== id));
            // If deleting current project, reset form
            if (id === currentProjectId) {
                handleClearForm();
            }
            setToastMessage(t.toastDeleted);
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
        setCurrentProjectId(null); // Reset current project ID
        localStorage.removeItem('autoSavedPrompt');
        setAutoSavedData(null);
    };
    
    const handleNewProject = () => {
        handleClearForm();
        setToastMessage("Nuevo proyecto iniciado");
        setTimeout(() => setToastMessage(''), 2000);
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
        
        setToastMessage(t.toastVarUpdated);
        setTimeout(() => setToastMessage(''), 2000);
    };

    // --- Auto Generation Handlers ---
    const handleAutoGenerate = async (field: 'responseGuidelines' | 'stepByStep' | 'notes') => {
        // Prerequisite check
        if (!promptData.agentRole || !promptData.task) {
            setError(t.errorPrerequisites);
            return;
        }
        setError(null);

        setActiveSuggestionField(field);
        setSuggestionModalOpen(true);
        setIsGeneratingSuggestion(true);
        setSuggestions([]);

        try {
            const result = await generateSuggestions(promptData, field, language);
            setSuggestions(result);
        } catch (e) {
            console.error(e);
            setError(t.errorGenSuggestions);
            setSuggestionModalOpen(false);
        } finally {
            setIsGeneratingSuggestion(false);
        }
    };

    const handleSelectSuggestion = (value: string) => {
        if (activeSuggestionField) {
            handleInputChange(activeSuggestionField, value);
            setSuggestionModalOpen(false);
            setToastMessage(t.toastContentInserted);
            setTimeout(() => setToastMessage(''), 2000);
        }
    };

    
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <Toast message={toastMessage} show={!!toastMessage} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} link={shareableLink} lang={language} />
            <SuggestionModal 
                isOpen={suggestionModalOpen} 
                onClose={() => setSuggestionModalOpen(false)} 
                onSelect={handleSelectSuggestion}
                loading={isGeneratingSuggestion}
                suggestions={suggestions}
                lang={language}
            />

            {/* Language Toggle */}
            <div className="absolute top-4 right-4 z-50 no-print">
                <button 
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:text-blue-600 hover:border-blue-500/50 transition-all shadow-sm"
                >
                    <LanguageIcon />
                    <span>{language === 'es' ? 'ESPAÑOL' : 'ENGLISH'}</span>
                </button>
            </div>

            <div className="w-full max-w-5xl mx-auto mb-20">
                <header className="relative text-center mb-12 no-print">
                    <div className="flex justify-center items-center gap-3 sm:gap-4 mb-2">
                        <Logo />
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
                            VoxWizard IA
                        </h1>
                    </div>
                    <p className="text-blue-600 font-mono text-sm uppercase tracking-widest font-semibold">
                        {t.subtitle}
                    </p>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        {t.description}
                    </p>
                </header>

                <PromptExamples onSelectExample={handleSelectExample} lang={language} />

                <main ref={formRef} className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xl mt-12 no-print relative overflow-hidden">
                    {/* Decorative top border */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                    {autoSavedData && (
                        <AutoSaveNotification
                            onRestore={handleRestoreAutoSave}
                            onDismiss={handleDismissAutoSave}
                            lang={language}
                        />
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    {t.configTitle}
                                </h2>
                                {currentProjectId && (
                                    <div className="mt-1 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-200">
                                            {t.editingBadge}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">{niche || '...'}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {currentProjectId && (
                                    <button
                                        type="button"
                                        onClick={handleNewProject}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-md transition-colors font-semibold"
                                    >
                                        <PlusIcon />
                                        {t.newProjectBtn}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleClearForm}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-md transition-colors"
                                >
                                    <TrashIcon />
                                    {t.clearBtn}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputField
                                    label={t.roleLabel}
                                    value={promptData.agentRole}
                                    onChange={(e) => handleInputChange('agentRole', e.target.value)}
                                    placeholder={t.rolePlaceholder}
                                    helpText={t.roleHelp}
                                    required
                                    onMicClick={() => handleMicClick('agentRole')}
                                    isListening={listeningField === 'agentRole'}
                                    micSupported={micSupported}
                                    lang={language}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <InputField
                                    label={t.taskLabel}
                                    value={promptData.task}
                                    onChange={(e) => handleInputChange('task', e.target.value)}
                                    placeholder={t.taskPlaceholder}
                                    helpText={t.taskHelp}
                                    required
                                    onMicClick={() => handleMicClick('task')}
                                    isListening={listeningField === 'task'}
                                    micSupported={micSupported}
                                    lang={language}
                                />
                            </div>
                            <InputField
                                label={t.personalityLabel}
                                value={promptData.personality}
                                onChange={(e) => handleInputChange('personality', e.target.value)}
                                placeholder={t.personalityPlaceholder}
                                helpText={t.personalityHelp}
                                onMicClick={() => handleMicClick('personality')}
                                isListening={listeningField === 'personality'}
                                micSupported={micSupported}
                                lang={language}
                            />
                             <InputField
                                label={t.toneLabel}
                                value={promptData.toneAndLanguage}
                                onChange={(e) => handleInputChange('toneAndLanguage', e.target.value)}
                                placeholder={t.tonePlaceholder}
                                helpText={t.toneHelp}
                                onMicClick={() => handleMicClick('toneAndLanguage')}
                                isListening={listeningField === 'toneAndLanguage'}
                                micSupported={micSupported}
                                lang={language}
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label={t.contextLabel}
                                    value={promptData.context}
                                    onChange={(e) => handleInputChange('context', e.target.value)}
                                    placeholder={t.contextPlaceholder}
                                    helpText={t.contextHelp}
                                    isTextarea
                                    onMicClick={() => handleMicClick('context')}
                                    isListening={listeningField === 'context'}
                                    micSupported={micSupported}
                                    lang={language}
                                />
                            </div>
                            <InputField
                                label={t.guidelinesLabel}
                                value={promptData.responseGuidelines}
                                onChange={(e) => handleInputChange('responseGuidelines', e.target.value)}
                                placeholder={t.guidelinesPlaceholder}
                                helpText={t.guidelinesHelp}
                                isTextarea
                                onMicClick={() => handleMicClick('responseGuidelines')}
                                isListening={listeningField === 'responseGuidelines'}
                                micSupported={micSupported}
                                onAutoGenerate={() => handleAutoGenerate('responseGuidelines')}
                                lang={language}
                            />
                            <InputField
                                label={t.stepByStepLabel}
                                value={promptData.stepByStep}
                                onChange={(e) => handleInputChange('stepByStep', e.target.value)}
                                placeholder={t.stepByStepPlaceholder}
                                helpText={t.stepByStepHelp}
                                isTextarea
                                onMicClick={() => handleMicClick('stepByStep')}
                                isListening={listeningField === 'stepByStep'}
                                micSupported={micSupported}
                                onAutoGenerate={() => handleAutoGenerate('stepByStep')}
                                lang={language}
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label={t.notesLabel}
                                    value={promptData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder={t.notesPlaceholder}
                                    helpText={t.notesHelp}
                                    onMicClick={() => handleMicClick('notes')}
                                    isListening={listeningField === 'notes'}
                                    micSupported={micSupported}
                                    onAutoGenerate={() => handleAutoGenerate('notes')}
                                    lang={language}
                                />
                            </div>

                             <div className="md:col-span-2 pt-6 border-t border-gray-100">
                                <InputField
                                    label={t.nicheLabel}
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    placeholder={t.nichePlaceholder}
                                    helpText={t.nicheHelp}
                                    required
                                    onMicClick={() => handleMicClick('niche')}
                                    isListening={listeningField === 'niche'}
                                    micSupported={micSupported}
                                    lang={language}
                                />
                            </div>

                             <div className="md:col-span-2 pt-6 border-t border-gray-100">
                                <DynamicVariables 
                                    variables={variables}
                                    onAdd={handleAddVariable}
                                    onUpdate={handleUpdateVariable}
                                    onDelete={handleDeleteVariable}
                                    onMicClick={handleMicClick}
                                    listeningField={listeningField}
                                    micSupported={micSupported}
                                    lang={language}
                                />
                            </div>

                        </div>
                        {error && <p className="text-red-500 text-center mt-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
                        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isLoading ? <Spinner /> : <SparklesIcon />}
                                {isLoading ? t.processingBtn : t.processBtn}
                            </button>
                             {generatedPrompt && !isLoading && (
                                <button
                                    type="button"
                                    onClick={handleSaveProject}
                                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 border font-semibold rounded-lg shadow-sm transition-colors duration-200 ${
                                        currentProjectId 
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                                    }`}
                                    aria-label="Guardar proyecto"
                                >
                                    <PlusIcon />
                                    {currentProjectId ? t.updateDbBtn : t.saveDbBtn}
                                </button>
                            )}
                        </div>
                    </form>
                </main>
                
                {(isLoading || generatedPrompt) && (
                    <div id="generated-prompt-print-area" className="mt-10">
                         <div className="print-header-content hidden">
                            <h2>{t.generatedTitle}</h2>
                        </div>
                        <h2 className="text-2xl font-bold text-center mb-4 text-blue-600 no-print uppercase tracking-wide">
                             {t.generatedTitle}
                        </h2>
                        <div className="relative bg-white p-6 rounded-xl border border-gray-200 min-h-[150px] shadow-xl">
                            {/* Header color strip */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                            
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-32 gap-4">
                                    <div className="text-blue-600">
                                        <Spinner />
                                    </div>
                                    <div className="animate-pulse text-blue-500 font-mono text-sm">{t.processingAgent}</div>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute top-4 right-4 flex gap-2 no-print z-10">
                                        <IconButton
                                            onClick={handleOpenShareModal}
                                            text={t.shareBtn}
                                            icon={<ShareIcon />}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                                        />
                                        <IconButton
                                            onClick={handleCopy}
                                            text={isCopied ? t.copiedBtn : t.copyBtn}
                                            icon={isCopied ? <CheckIcon /> : <CopyIcon />}
                                            className={isCopied ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'}
                                        />
                                        <IconButton
                                            onClick={handleDownloadMarkdown}
                                            text="MD"
                                            icon={<DownloadIcon />}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                                        />
                                        <IconButton
                                            onClick={handleExportPdf}
                                            text={t.btnSavePDF}
                                            icon={<PdfIcon />}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                                        />
                                    </div>
                                    <MarkdownEditor 
                                        value={generatedPrompt} 
                                        onChange={setGeneratedPrompt}
                                        variables={variables}
                                        onVariableUpdate={handleVariableEditFromEditor}
                                        lang={language}
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
                    lang={language}
                />
            </div>
        </div>
    );
};

export default App;
