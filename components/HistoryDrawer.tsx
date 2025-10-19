import React, { useState } from 'react';
import { PromptHistoryItem } from '../types';
import { HistoryIcon, TrashIcon, MarkdownIcon, PdfIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';

interface HistoryDrawerProps {
    history: PromptHistoryItem[];
    onSelect: (item: PromptHistoryItem) => void;
    onClear: () => void;
    onExportMarkdown: () => void;
    onExportPdf: () => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ history, onSelect, onClear, onExportMarkdown, onExportPdf }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (item: PromptHistoryItem) => {
        onSelect(item);
        setIsOpen(false); 
    };

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 z-40 bg-gray-800/70 backdrop-blur-lg border-t border-gray-700 shadow-2xl transition-all duration-300 ease-in-out`}
            style={{ height: isOpen ? '60vh' : 'auto' }}
        >
            <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
                <header 
                    className="flex items-center justify-between p-4 cursor-pointer flex-shrink-0"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-3">
                        <HistoryIcon />
                        <h2 className="text-lg font-bold text-gray-200">
                            Prompts Guardados
                        </h2>
                        <span className="text-sm bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                            {history.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                         {history.length > 0 && !isOpen && (
                            <div className="hidden sm:flex items-center gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onExportMarkdown(); }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-blue-900/50 text-gray-300 hover:text-blue-300 font-semibold rounded-lg transition-colors duration-200"
                                >
                                    <MarkdownIcon />
                                    Exportar MD
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onExportPdf(); }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-blue-900/50 text-gray-300 hover:text-blue-300 font-semibold rounded-lg transition-colors duration-200"
                                >
                                    <PdfIcon />
                                    Exportar PDF
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-300 font-semibold rounded-lg transition-colors duration-200"
                                >
                                    <TrashIcon />
                                    Limpiar
                                </button>
                            </div>
                         )}
                        <button className="p-1 text-gray-400 hover:text-white">
                            {isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
                        </button>
                    </div>
                </header>

                {isOpen && (
                    <div className="flex-grow overflow-y-auto p-4 border-t border-gray-700/50">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center py-8">
                                <div className="text-gray-600 mb-4">
                                    <HistoryIcon className="w-16 h-16" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-400">No hay prompts guardados</h3>
                                <p>Los prompts que generes aparecerán aquí.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {history.map(item => (
                                    <li key={item.id}>
                                        <button 
                                            onClick={() => handleSelect(item)}
                                            className="w-full text-left p-4 bg-gray-900/50 hover:bg-gray-700/80 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-blue-400 truncate pr-4">{item.promptData.agentRole || 'Prompt sin rol'}</p>
                                                <p className="text-xs text-gray-400 flex-shrink-0">
                                                    {new Date(item.timestamp).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-300 mt-2 line-clamp-2">{item.generatedPrompt}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
                 {isOpen && history.length > 0 && (
                     <footer className="p-4 border-t border-gray-700 flex-shrink-0 space-y-4">
                        <div className="flex gap-3">
                            <button
                                onClick={onExportMarkdown}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-blue-900/50 text-gray-300 hover:text-blue-300 font-semibold rounded-lg transition-colors duration-200"
                            >
                                <MarkdownIcon />
                                Exportar a Markdown
                            </button>
                            <button
                                onClick={onExportPdf}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-blue-900/50 text-gray-300 hover:text-blue-300 font-semibold rounded-lg transition-colors duration-200"
                            >
                                <PdfIcon />
                                Exportar a PDF
                            </button>
                        </div>
                        <button 
                            onClick={onClear}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-red-900/50 text-gray-300 hover:text-red-300 font-semibold rounded-lg transition-colors duration-200"
                        >
                            <TrashIcon />
                            Limpiar Base de Datos
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default HistoryDrawer;