
import React, { useState } from 'react';
import { PromptHistoryItem } from '../types';
import { HistoryIcon, TrashIcon, DownloadIcon, PdfIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon } from './Icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { translations, Language } from '../translations';

interface SavedPromptsProps {
    history: PromptHistoryItem[];
    onSelect: (item: PromptHistoryItem) => void;
    onDelete: (id: string) => void;
    lang: Language;
}

const SavedPrompts: React.FC<SavedPromptsProps> = ({ history, onSelect, onDelete, lang }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const t = translations[lang];

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
        let markdownContent = `# ${t.mdTitle}\n\n`;

        items.forEach(item => {
            markdownContent += `## ${t.mdPromptFor}: ${item.niche || t.mdNoNiche}\n\n`;
            markdownContent += `**${t.mdDate}:** ${new Date(item.timestamp).toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB')}\n\n`;
            markdownContent += `### ${t.mdInputData}:\n`;
            markdownContent += "```json\n" + JSON.stringify(item.promptData, null, 2) + "\n```\n\n";
             if (item.variables && item.variables.length > 0) {
                markdownContent += `### ${t.mdDynamicVars}:\n`;
                markdownContent += "```json\n" + JSON.stringify(item.variables.reduce((acc, v) => ({...acc, [v.name]: v.value}), {}), null, 2) + "\n```\n\n";
            }
            markdownContent += `### ${t.mdGeneratedPrompt}:\n`;
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

    const handleDownloadPdf = async () => {
        const content = document.getElementById('history-print-area');
        if (!content) return;

        try {
            // Capture the entire history table area
            const canvas = await html2canvas(content, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                ignoreElements: (element) => element.classList.contains('no-print') // Ignore search inputs/buttons if tagged
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width mm
            const pageHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [imgWidth, pageHeight] // Auto-height
            });

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);
            pdf.save('historial-prompts.pdf');

        } catch (e) {
            console.error("Error generating history PDF", e);
            alert(t.errorPDFHistory);
        }
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
                        {t.historyTitle}
                    </h2>
                    <p className="text-gray-500 text-sm font-mono mt-1">{t.historySubtitle}</p>
                </div>
                {history.length > 0 && (
                     <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
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
                                {t.exportBtn}
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors uppercase tracking-wider shadow-sm"
                            >
                                <PdfIcon />
                                {t.printBtn}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="print-header-content hidden">
                 <h2 className="text-2xl font-bold">{t.historyTitle}</h2>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl no-print">
                    <HistoryIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">{t.noHistory}</h3>
                    <p className="text-gray-500 text-sm">{t.noHistorySub}</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                 <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl no-print">
                    <SearchIcon />
                    <h3 className="text-lg font-semibold text-gray-600 mt-4">{t.noMatches}</h3>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th scope="col" className="px-6 py-4 tracking-wider">
                                        {t.thNiche}
                                    </th>
                                    <th scope="col" className="px-6 py-4 tracking-wider">
                                        {t.thAgent}
                                    </th>
                                    <th scope="col" className="px-6 py-4 tracking-wider">
                                        {t.thDate}
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right no-print w-28">
                                        {t.thAction}
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
                                                {new Date(item.timestamp).toLocaleDateString(lang === 'es' ? 'en-GB' : 'en-US')} <span className="text-gray-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-2">{t.detailLog}</h4>
                                                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                            {item.promptData ? (
                                                                <>
                                                                    {renderDetail(t.detailRole, item.promptData.agentRole)}
                                                                    {renderDetail(t.detailTask, item.promptData.task)}
                                                                    {renderDetail(t.detailPersonality, item.promptData.personality)}
                                                                    {renderDetail(t.detailTone, item.promptData.toneAndLanguage)}
                                                                    <div className="md:col-span-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                                        {renderDetail(t.detailContext, item.promptData.context, true)}
                                                                    </div>
                                                                    <div className="md:col-span-2 bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                                        {renderDetail(t.detailGuidelines, item.promptData.responseGuidelines, true)}
                                                                    </div>
                                                                </>
                                                            ) : null}
                                                            
                                                             {item.variables && item.variables.length > 0 && (
                                                                <div className="md:col-span-2 pt-2">
                                                                    <dt className="font-bold text-indigo-600 text-xs uppercase tracking-wider mb-2">{t.detailVars}</dt>
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
                                                                    <dt className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">{t.detailOutput}</dt>
                                                                    <dd className="whitespace-pre-wrap font-mono text-gray-700 bg-white p-4 rounded border border-gray-300 shadow-inner text-xs">
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
