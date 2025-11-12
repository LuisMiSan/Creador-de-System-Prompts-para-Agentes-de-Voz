import React, { useState } from 'react';
import { PromptHistoryItem } from '../types';
import { HistoryIcon, TrashIcon, DownloadIcon, PdfIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface SavedPromptsProps {
    history: PromptHistoryItem[];
    onSelect: (item: PromptHistoryItem) => void;
    onDelete: (id: string) => void;
}

const SavedPrompts: React.FC<SavedPromptsProps> = ({ history, onSelect, onDelete }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleToggleExpand = (id: string) => {
        setExpandedId(currentId => (currentId === id ? null : id));
    };
    
    // Sort prompts by timestamp, newest first
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

    const handleExportMarkdown = (items: PromptHistoryItem[]) => {
        let markdownContent = "# Mi Base de Datos de Prompts\n\n";

        items.forEach(item => {
            markdownContent += `## Prompt para: ${item.niche}\n\n`;
            markdownContent += `**Fecha:** ${new Date(item.timestamp).toLocaleString('es-ES')}\n\n`;
            markdownContent += "### Datos de Entrada:\n";
            markdownContent += "```json\n" + JSON.stringify(item.promptData, null, 2) + "\n```\n\n";
            markdownContent += "### Prompt Generado:\n";
            markdownContent += item.generatedPrompt + "\n\n";
            markdownContent += "---\n\n";
        });

        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voxwizard-prompts.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    const renderDetail = (label: string, value: string | undefined | null, isPreWrap = false) => {
        if (!value || value.trim() === '') return null;
        return (
            <div>
                <dt className="font-semibold text-gray-400">{label}</dt>
                <dd className={`text-gray-200 mt-1 ${isPreWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
            </div>
        );
    };


    return (
        <section className="mt-12 print-section">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 no-print">
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-300 flex items-center justify-center sm:justify-start gap-3">
                        <HistoryIcon />
                        Mi Base de Datos de Prompts
                    </h2>
                    <p className="text-gray-400">Aquí se guardan todos los prompts que creas. Haz clic en una fila para cargarla.</p>
                </div>
                {history.length > 0 && (
                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        <button
                            onClick={() => handleExportMarkdown(sortedHistory)}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 font-semibold rounded-lg transition-colors"
                        >
                            <DownloadIcon />
                            Exportar Markdown
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 font-semibold rounded-lg transition-colors"
                        >
                            <PdfIcon />
                            Imprimir / PDF
                        </button>
                    </div>
                )}
            </div>

            <div id="print-header" className="hidden">
                 <h2 className="text-2xl font-bold">Mi Base de Datos de Prompts</h2>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl no-print">
                    <HistoryIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400">Tu base de datos está vacía</h3>
                    <p className="text-gray-500">Rellena el formulario para empezar a crear y guardar prompts.</p>
                </div>
            ) : (
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-300 uppercase bg-gray-900/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">
                                        Empresa / Nicho
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        Prompt
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        Fecha
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right no-print w-28">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedHistory.map(item => (
                                    <React.Fragment key={item.id}>
                                        <tr 
                                            className="border-b border-gray-700 hover:bg-gray-800/70 cursor-pointer transition-colors duration-200"
                                            onClick={() => onSelect(item)}
                                        >
                                            <td className="px-6 py-4 align-top">
                                                <span className="bg-blue-900/70 text-blue-300 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap capitalize">
                                                    {item.niche || 'Sin Nicho'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-bold text-gray-200 line-clamp-1">
                                                    {item.promptData.agentRole || 'Prompt sin rol'}
                                                </div>
                                                <div className="text-gray-500 mt-1 line-clamp-2">
                                                    {item.generatedPrompt}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap align-top">
                                                {new Date(item.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-right no-print align-top">
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleExpand(item.id);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors"
                                                        aria-label="Ver detalles"
                                                    >
                                                        {expandedId === item.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            onDelete(item.id);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                                        aria-label="Eliminar prompt"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === item.id && (
                                            <tr className="bg-gray-900/40 no-print">
                                                <td colSpan={4} className="p-0">
                                                    <div className="p-6 bg-gray-800/50">
                                                        <h4 className="text-base font-semibold text-gray-200 mb-4">Detalles Completos del Prompt</h4>
                                                        <dl className="space-y-4 text-sm">
                                                            {renderDetail("Rol del Agente", item.promptData.agentRole)}
                                                            {renderDetail("Tarea Principal", item.promptData.task)}
                                                            {renderDetail("Personalidad", item.promptData.personality)}
                                                            {renderDetail("Tono y Lenguaje", item.promptData.toneAndLanguage)}
                                                            {renderDetail("Contexto (Base de Conocimiento)", item.promptData.context, true)}
                                                            {renderDetail("Directrices de Respuesta", item.promptData.responseGuidelines, true)}
                                                            {renderDetail("Flujo de Conversación (Paso a Paso)", item.promptData.stepByStep, true)}
                                                            {renderDetail("Notas Adicionales", item.promptData.notes)}
                                                            
                                                            {item.generatedPrompt && (
                                                                <div className="pt-4 border-t border-gray-700">
                                                                    <dt className="font-semibold text-gray-400 mb-1">Prompt Generado</dt>
                                                                    <dd className="whitespace-pre-wrap font-mono text-xs text-gray-300 bg-gray-900 p-4 rounded-md border border-gray-700">
                                                                        {item.generatedPrompt}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                        </dl>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SavedPrompts;