
import React, { useState } from 'react';
import { PromptHistoryItem } from '../types';
import { HistoryIcon, TrashIcon, DownloadIcon, PdfIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon } from './Icons';

interface SavedPromptsProps {
    history: PromptHistoryItem[];
    onSelect: (item: PromptHistoryItem) => void;
    onDelete: (id: string) => void;
}

const SavedPrompts: React.FC<SavedPromptsProps> = ({ history, onSelect, onDelete }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const handleToggleExpand = (id: string) => {
        setExpandedId(currentId => (currentId === id ? null : id));
    };
    
    // Sort prompts by timestamp, newest first
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

    // Filter prompts based on search query
    const filteredHistory = sortedHistory.filter(item => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        
        const nicheMatch = (item.niche || '').toLowerCase().includes(query);
        const roleMatch = (item.promptData?.agentRole || '').toLowerCase().includes(query);
        const promptMatch = (item.generatedPrompt || '').toLowerCase().includes(query);

        return nicheMatch || roleMatch || promptMatch;
    });

    const handleExportMarkdown = (items: PromptHistoryItem[]) => {
        let markdownContent = "# Mi Base de Datos de Prompts\n\n";

        items.forEach(item => {
            markdownContent += `## Prompt para: ${item.niche || 'Sin Nicho'}\n\n`;
            markdownContent += `**Fecha:** ${new Date(item.timestamp).toLocaleString('es-ES')}\n\n`;
            markdownContent += "### Datos de Entrada:\n";
            markdownContent += "```json\n" + JSON.stringify(item.promptData, null, 2) + "\n```\n\n";
             if (item.variables && item.variables.length > 0) {
                markdownContent += "### Variables Dinámicas:\n";
                markdownContent += "```json\n" + JSON.stringify(item.variables.reduce((acc, v) => ({...acc, [v.name]: v.value}), {}), null, 2) + "\n```\n\n";
            }
            markdownContent += "### Prompt Generado:\n";
            markdownContent += item.generatedPrompt + "\n\n";
            markdownContent += "---\n\n";
        });

        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deepcode-prompts.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const content = document.getElementById('history-print-area');
        if (!content) return;

         // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        // Clone content but strip classes that hide it
        const contentClone = content.cloneNode(true) as HTMLElement;
        const hiddenElements = contentClone.querySelectorAll('.hidden');
        hiddenElements.forEach(el => el.classList.remove('hidden'));
        
        // Remove no-print elements from clone
        const noPrintElements = contentClone.querySelectorAll('.no-print');
        noPrintElements.forEach(el => el.remove());

        // Helper to get all row content even if not expanded in UI
        
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Historial de Prompts</title>
                <style>
                    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #000; background: #fff; padding: 20px; font-size: 10pt; }
                    h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .tag { background: #eee; padding: 2px 5px; border-radius: 3px; border: 1px solid #ccc; font-size: 0.85em; }
                    .timestamp { color: #666; font-size: 0.9em; }
                    
                    /* Hide utilities that might have slipped through */
                    button, input { display: none !important; }
                </style>
            </head>
            <body>
                <h1>Historial de Procesamiento</h1>
                ${contentClone.innerHTML}
            </body>
            </html>
        `);
        doc.close();

        iframe.onload = () => {
             setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        };
    };

    const renderDetail = (label: string, value: string | undefined | null, isPreWrap = false) => {
        if (!value || value.trim() === '') return null;
        return (
            <div>
                <dt className="font-bold text-blue-600 text-xs uppercase tracking-wider mb-1">{label}</dt>
                <dd className={`text-gray-700 text-sm ${isPreWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
            </div>
        );
    };


    return (
        <section id="history-print-area" className="mt-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 no-print">
                <div className="text-center md:text-left flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-3 uppercase tracking-wide">
                        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                        Processing History
                    </h2>
                    <p className="text-gray-500 text-sm font-mono mt-1">Database records and generated outputs.</p>
                </div>
                {history.length > 0 && (
                     <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => handleExportMarkdown(filteredHistory)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors uppercase tracking-wider shadow-sm"
                            >
                                <DownloadIcon />
                                Export
                            </button>
                            <button
                                onClick={handlePrint}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors uppercase tracking-wider shadow-sm"
                            >
                                <PdfIcon />
                                Print
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="print-header-content hidden">
                 <h2 className="text-2xl font-bold">System Prompt Database</h2>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl no-print">
                    <HistoryIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No processing history yet</h3>
                    <p className="text-gray-500 text-sm">Generate your first prompt to populate this table.</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                 <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl no-print">
                    <SearchIcon />
                    <h3 className="text-lg font-semibold text-gray-600 mt-4">No matches found</h3>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th scope="col" className="px-6 py-4 tracking-wider">
                                        Niche / Tag
                                    </th>
                                    <th scope="col" className="px-6 py-4 tracking-wider">
                                        Agent Definition
                                    </th>
                                    <th scope="col" className="px-6 py-4 tracking-wider">
                                        Timestamp
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right no-print w-28">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHistory.map(item => (
                                    <React.Fragment key={item.id}>
                                        <tr 
                                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                            onClick={() => onSelect(item)}
                                        >
                                            <td className="px-6 py-4 align-top">
                                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap uppercase tracking-wide font-semibold">
                                                    {item.niche || 'GENERIC'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-bold text-gray-800 line-clamp-1 text-sm mb-1">
                                                    {item.promptData?.agentRole || 'Undefined Role'}
                                                </div>
                                                <div className="text-gray-400 font-mono text-xs line-clamp-1">
                                                    ID: {item.id.substring(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap align-top font-mono text-xs text-gray-500">
                                                {new Date(item.timestamp).toLocaleDateString('en-GB')} <span className="text-gray-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right no-print align-top">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleExpand(item.id);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    >
                                                        {expandedId === item.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            onDelete(item.id);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === item.id && (
                                            <tr className="bg-gray-50 no-print">
                                                <td colSpan={4} className="p-0 border-l-4 border-blue-500">
                                                    <div className="p-6 grid grid-cols-1 gap-6">
                                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-2">System Log Details</h4>
                                                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                            {item.promptData ? (
                                                                <>
                                                                    {renderDetail("Agent Role", item.promptData.agentRole)}
                                                                    {renderDetail("Task", item.promptData.task)}
                                                                    {renderDetail("Personality", item.promptData.personality)}
                                                                    {renderDetail("Tone", item.promptData.toneAndLanguage)}
                                                                    <div className="md:col-span-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                                        {renderDetail("Context / Knowledge Base", item.promptData.context, true)}
                                                                    </div>
                                                                    <div className="md:col-span-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                                        {renderDetail("Guidelines", item.promptData.responseGuidelines, true)}
                                                                    </div>
                                                                </>
                                                            ) : null}
                                                            
                                                             {item.variables && item.variables.length > 0 && (
                                                                <div className="md:col-span-2 pt-2">
                                                                    <dt className="font-bold text-indigo-600 text-xs uppercase tracking-wider mb-2">Defined Variables</dt>
                                                                    <dd>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {item.variables.map(v => (
                                                                                <span key={v.id} className="flex items-center gap-2 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-xs">
                                                                                    <span className="font-mono text-indigo-700">{`{{${v.name}}}`}</span>
                                                                                    <span className="text-gray-400">=</span>
                                                                                    <span className="text-gray-700">{v.value}</span>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </dd>
                                                                </div>
                                                            )}

                                                            {item.generatedPrompt && (
                                                                <div className="md:col-span-2 pt-4 mt-2 border-t border-gray-200">
                                                                    <dt className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">Compiled Output</dt>
                                                                    <dd className="whitespace-pre-wrap font-mono text-xs text-gray-700 bg-white p-4 rounded border border-gray-300 shadow-inner">
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
