import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

    const tabClasses = (tabName: 'preview' | 'edit') => 
        `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tabName 
            ? 'bg-orange-600 text-white' 
            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
        }`;

    return (
        <div>
            {/* Tabs are not printed */}
            <div className="flex items-center gap-2 mb-3 no-print">
                <button onClick={() => setActiveTab('preview')} className={tabClasses('preview')}>
                    Vista Previa
                </button>
                <button onClick={() => setActiveTab('edit')} className={tabClasses('edit')}>
                    Editar Markdown
                </button>
            </div>
            
            {/* Edit View (Textarea) - not printed */}
            <div className={`${activeTab === 'edit' ? 'block' : 'hidden'} no-print`}>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-96 p-4 rounded-md bg-gray-900 border border-gray-600 text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                    aria-label="Editor de Markdown"
                />
            </div>
            
            {/* 
              Preview View (ReactMarkdown)
              - It is hidden on screen if 'edit' tab is active.
              - It is ALWAYS visible for printing.
            */}
            <div className={activeTab === 'preview' ? 'block' : 'hidden-for-screen'}>
                 <div className="prose-styles prompt-content-for-print">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {value}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default MarkdownEditor;