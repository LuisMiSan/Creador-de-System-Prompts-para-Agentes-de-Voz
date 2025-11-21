
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
        const printArea = document.getElementById('history-print-area');
        if (!printArea) return;

        printArea.classList.add('print-section');

        const afterPrint = () => {
            printArea.classList.remove('print-section');
            window.removeEventListener('afterprint', afterPrint);
        };
        window.addEventListener('afterprint', afterPrint);

        window.print();
    };

    const renderDetail = (label: string, value: string | undefined | null, isPreWrap = false) => {
        if (!value || value.trim() === '') return null;
        return (
            <div>
                <dt className="font-bold text-cyan-500/80 text-xs uppercase tracking-wider mb-1">{label}</dt>
                <dd className={`text-gray-300 text-sm ${isPreWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</dd>
            </div>
        );
    };


    return (
        <section id="history-print-area" className="mt-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 no-print">
                <div className="text-center md:text-left flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cyan-400 flex items-center justify-center sm:justify-start gap-3 uppercase tracking-wide">
                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                        Processing History
                    </h2>
                    <p className="text-gray-500 text-sm font-mono mt-1">Database records and generated outputs.</p>
                </div>
                {history.length > 0 && (
                     <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-[#0B0F19] border border-gray-700 rounded-lg text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-600 transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => handleExportMarkdown(filteredHistory)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs bg-[#1e293b] hover:bg-cyan-900/20 border border-gray-700 hover:border-cyan-500/50 text-gray-300 font-semibold rounded-lg transition-colors uppercase tracking-wider"
                            >
                                <DownloadIcon />
                                Export
                            </button>
                            <button
                                onClick={handlePrint}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs bg-[#1e293b] hover:bg-cyan-900/20 border border-gray-700 hover:border-cyan-500/50 text-gray-300 font-semibold rounded-lg transition-colors uppercase tracking-wider"
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
                <div className="text-center py-12 bg-[#131b2e]/50 border border-dashed border-gray-700 rounded-xl no-print">
                    <HistoryIcon className="w-12 h-12 mx-auto text-gray-700 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-500">No processing history yet</h3>
                    <p className="text-gray-600 text-sm">Generate your first prompt to populate this table.</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                 <div className="text-center py-12 bg-[#131b2e]/50 border border-dashed border-gray-700 rounded-xl no-print">
                    <SearchIcon />
                    <h3 className="text-lg font-semibold text-gray-500 mt-4">No matches found</h3>
                </div>
            ) : (
                <div className="bg-[#131b2e] border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-cyan-400 uppercase bg-[#0B0F19] border-b border-gray-700">
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
                            <tbody className="divide-y divide-gray-800">
                                {filteredHistory.map(item => (
                                    <React.Fragment key={item.id}>
                                        <tr 
                                            className="hover:bg-cyan-900/10 cursor-pointer transition-colors duration-200"
                                            onClick={() => onSelect(item)}
                                        >
                                            <td className="px-6 py-4 align-top">
                                                <span className="bg-purple-900/30 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap uppercase tracking-wide">
                                                    {item.niche || 'GENERIC'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-bold text-gray-200 line-clamp-1 text-sm mb-1">
                                                    {item.promptData?.agentRole || 'Undefined Role'}
                                                </div>
                                                <div className="text-gray-500 font-mono text-xs line-clamp-1">
                                                    ID: {item.id.substring(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap align-top font-mono text-xs text-gray-500">
                                                {new Date(item.timestamp).toLocaleDateString('en-GB')} <span className="text-gray-600">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right no-print align-top">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleExpand(item.id);
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors"
                                                    >
                                                        {expandedId === item.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); 
                                                            onDelete(item.id);
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === item.id && (
                                            <tr className="bg-[#0B0F19] no-print">
                                                <td colSpan={4} className="p-0 border-l-4 border-cyan-500">
                                                    <div className="p-6 grid grid-cols-1 gap-6">
                                                        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider border-b border-gray-800 pb-2">System Log Details</h4>
                                                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                            {item.promptData ? (
                                                                <>
                                                                    {renderDetail("Agent Role", item.promptData.agentRole)}
                                                                    {renderDetail("Task", item.promptData.task)}
                                                                    {renderDetail("Personality", item.promptData.personality)}
                                                                    {renderDetail("Tone", item.promptData.toneAndLanguage)}
                                                                    <div className="md:col-span-2 bg-[#131b2e] p-3 rounded border border-gray-800">
                                                                        {renderDetail("Context / Knowledge Base", item.promptData.context, true)}
                                                                    </div>
                                                                    <div className="md:col-span-2 bg-[#131b2e] p-3 rounded border border-gray-800">
                                                                        {renderDetail("Guidelines", item.promptData.responseGuidelines, true)}
                                                                    </div>
                                                                </>
                                                            ) : null}
                                                            
                                                             {item.variables && item.variables.length > 0 && (
                                                                <div className="md:col-span-2 pt-2">
                                                                    <dt className="font-bold text-purple-400 text-xs uppercase tracking-wider mb-2">Defined Variables</dt>
                                                                    <dd>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {item.variables.map(v => (
                                                                                <span key={v.id} className="flex items-center gap-2 px-2 py-1 bg-purple-900/20 border border-purple-500/30 rounded text-xs">
                                                                                    <span className="font-mono text-purple-300">{`{{${v.name}}}`}</span>
                                                                                    <span className="text-gray-500">=</span>
                                                                                    <span className="text-gray-300">{v.value}</span>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </dd>
                                                                </div>
                                                            )}

                                                            {item.generatedPrompt && (
                                                                <div className="md:col-span-2 pt-4 mt-2 border-t border-gray-800">
                                                                    <dt className="font-bold text-cyan-400 text-xs uppercase tracking-wider mb-2">Compiled Output</dt>
                                                                    <dd className="whitespace-pre-wrap font-mono text-xs text-gray-300 bg-[#020617] p-4 rounded border border-gray-700">
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
