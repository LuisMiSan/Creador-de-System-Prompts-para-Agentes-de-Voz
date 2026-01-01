
import React from 'react';
import { CloseIcon, CheckIcon, SparklesIcon } from './Icons';
import { translations, Language } from '../translations';
import Spinner from './Spinner';

interface SuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    loading: boolean;
    suggestions: string[];
    lang: Language;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    loading, 
    suggestions, 
    lang 
}) => {
    const t = translations[lang];

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[#131b2e] border border-cyan-900/50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-[#0B0F19]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg border border-purple-500/30">
                            <SparklesIcon />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                                {t.suggestionTitle}
                            </h2>
                            <p className="text-xs text-gray-500">{t.suggestionSubtitle}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                                <Spinner />
                            </div>
                            <p className="text-cyan-400 animate-pulse font-mono text-sm">{t.generating}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {suggestions.map((option, idx) => (
                                <div 
                                    key={idx}
                                    className="group relative flex flex-col bg-[#0B0F19] border border-gray-700 rounded-xl p-5 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all duration-300"
                                >
                                    <div className="absolute -top-3 left-4 bg-[#1e293b] text-cyan-400 text-[10px] font-bold px-2 py-1 rounded border border-gray-700 uppercase tracking-widest">
                                        Opción {idx + 1}
                                    </div>
                                    
                                    <div className="mt-2 mb-6 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap flex-grow">
                                        {option}
                                    </div>

                                    <button
                                        onClick={() => onSelect(option)}
                                        className="mt-auto w-full py-2 bg-gray-800 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-purple-600 text-gray-300 hover:text-white font-semibold rounded-lg border border-gray-700 hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wide group-hover:shadow-lg"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                        {t.useThisOption}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuggestionModal;
