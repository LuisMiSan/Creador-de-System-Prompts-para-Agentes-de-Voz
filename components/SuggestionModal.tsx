
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
            className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg border border-blue-200 text-blue-600">
                            <SparklesIcon />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {t.suggestionTitle}
                            </h2>
                            <p className="text-xs text-gray-500">{t.suggestionSubtitle}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="relative text-blue-600">
                                <Spinner />
                            </div>
                            <p className="text-blue-500 animate-pulse font-mono text-sm">{t.generating}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {suggestions.map((option, idx) => (
                                <div 
                                    key={idx}
                                    className="group relative flex flex-col bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="absolute -top-3 left-4 bg-gray-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-gray-200 uppercase tracking-widest">
                                        Opción {idx + 1}
                                    </div>
                                    
                                    <div className="mt-2 mb-6 text-gray-600 text-sm leading-relaxed whitespace-pre-wrap flex-grow">
                                        {option}
                                    </div>

                                    <button
                                        onClick={() => onSelect(option)}
                                        className="mt-auto w-full py-2 bg-gray-50 hover:bg-blue-600 text-gray-600 hover:text-white font-semibold rounded-lg border border-gray-200 hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wide group-hover:shadow-md"
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
