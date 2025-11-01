
import React from 'react';
import { PromptHistoryItem } from '../types';
import { HistoryIcon, TrashIcon } from './Icons';

interface SavedPromptsProps {
    history: PromptHistoryItem[];
    onSelect: (item: PromptHistoryItem) => void;
    onDelete: (id: string) => void;
}

const SavedPrompts: React.FC<SavedPromptsProps> = ({ history, onSelect, onDelete }) => {
    
    // Agrupar prompts por nicho
    // FIX: Corrected the TypeScript error by removing the explicit generic type argument from .reduce()
    // and instead providing a type assertion for the initial value. This helps TypeScript correctly infer the accumulator type.
    const promptsByNiche = history.reduce((acc, item) => {
        const niche = item.niche || 'Sin Nicho';
        if (!acc[niche]) {
            acc[niche] = [];
        }
        acc[niche].push(item);
        return acc;
    }, {} as Record<string, PromptHistoryItem[]>);

    const sortedNiches = Object.keys(promptsByNiche).sort((a, b) => a.localeCompare(b));

    return (
        <section className="mt-12">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-300 flex items-center justify-center gap-3">
                    <HistoryIcon />
                    Mi Base de Datos de Prompts
                </h2>
                <p className="text-gray-400">Aquí se guardan todos los prompts que creas, organizados por nicho.</p>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl">
                    <HistoryIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400">Tu base de datos está vacía</h3>
                    <p className="text-gray-500">Rellena el formulario de abajo para empezar a crear y guardar prompts.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedNiches.map(niche => (
                        <div key={niche}>
                            <h3 className="text-xl font-semibold text-blue-400 border-b-2 border-gray-700 pb-2 mb-4 capitalize">
                                Nicho: {niche}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {promptsByNiche[niche].map(item => (
                                    <div 
                                        key={item.id}
                                        className="bg-gray-800/60 border border-gray-700 rounded-xl p-5 flex flex-col group cursor-pointer hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300"
                                        onClick={() => onSelect(item)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="font-bold text-gray-100 line-clamp-2 pr-2 flex-grow">
                                                {item.promptData.agentRole || 'Prompt sin rol'}
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Evita que se seleccione el prompt al borrar
                                                    onDelete(item.id);
                                                }}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Eliminar prompt"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-grow">
                                            {item.generatedPrompt}
                                        </p>
                                        <p className="text-xs text-gray-500 text-right mt-auto">
                                            {new Date(item.timestamp).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default SavedPrompts;
