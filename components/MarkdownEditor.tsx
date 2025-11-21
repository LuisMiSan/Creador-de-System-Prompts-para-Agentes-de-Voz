
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DynamicVariable } from '../types';
import { CheckIcon, CloseIcon } from './Icons';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    variables?: DynamicVariable[];
    onVariableUpdate?: (oldName: string, newName: string, newValue: string) => void;
}

interface EditingVarState {
    name: string;
    originalName: string;
    value: string;
    rect: DOMRect;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, variables = [], onVariableUpdate }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
    const [editingVar, setEditingVar] = useState<EditingVarState | null>(null);
    
    // Refs for the popover logic
    const popoverRef = useRef<HTMLDivElement>(null);

    const tabClasses = (tabName: 'preview' | 'edit') => 
        `px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors border-t border-x ${
            activeTab === tabName 
            ? 'bg-[#1e293b] border-cyan-900 text-cyan-400 border-b-transparent' 
            : 'bg-[#0B0F19] border-transparent text-gray-500 hover:text-gray-300 border-b-gray-700'
        }`;

    // Regex to find {{variable_name}}
    const VARIABLE_REGEX = /(\{\{[a-zA-Z0-9_]+\}\})/g;

    // Handle click outside popover to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setEditingVar(null);
            }
        };
        if (editingVar) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingVar]);

    const handleVariableClick = (varName: string, e: React.MouseEvent<HTMLSpanElement>) => {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = e.currentTarget.getBoundingClientRect();
        // Clean the name (remove {{ and }})
        const cleanName = varName.replace(/[{}]/g, '');
        
        // Find current value in props if it exists
        const currentVar = variables.find(v => v.name === cleanName);
        const val = currentVar ? currentVar.value : '';

        setEditingVar({
            name: cleanName,
            originalName: cleanName,
            value: val,
            rect: rect
        });
    };

    const handleSaveVariable = () => {
        if (editingVar && onVariableUpdate) {
            onVariableUpdate(editingVar.originalName, editingVar.name, editingVar.value);
            setEditingVar(null);
        }
    };

    // Helper to recursively parse children and wrap {{variables}}
    const renderContentWithVariables = (children: React.ReactNode): React.ReactNode => {
        return React.Children.map(children, child => {
            if (typeof child === 'string') {
                const parts = child.split(VARIABLE_REGEX);
                return parts.map((part, i) => {
                    if (part.match(VARIABLE_REGEX)) {
                        return (
                            <span 
                                key={i}
                                onClick={(e) => handleVariableClick(part, e)}
                                className="inline-block bg-purple-900/40 text-purple-300 border border-purple-500/40 rounded px-1.5 py-0.5 mx-0.5 cursor-pointer hover:bg-purple-800/60 hover:border-purple-300 transition-colors select-none text-[0.9em] font-mono shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                title="Clic para editar variable"
                            >
                                {part}
                            </span>
                        );
                    }
                    return part;
                });
            }
            // Recursively process elements
            if (React.isValidElement(child)) {
                const props = child.props as { children?: React.ReactNode };
                if (props.children) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        children: renderContentWithVariables(props.children)
                    });
                }
            }
            return child;
        });
    };

    // Custom renderers for ReactMarkdown to intercept text
    const customRenderers = {
        p: ({ children }: any) => <p className="mb-4">{renderContentWithVariables(children)}</p>,
        li: ({ children }: any) => <li className="mb-1">{renderContentWithVariables(children)}</li>,
        h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2 text-white">{renderContentWithVariables(children)}</h1>,
        h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-6 text-cyan-400 uppercase tracking-wide">{renderContentWithVariables(children)}</h2>,
        h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 mt-4 text-gray-200">{renderContentWithVariables(children)}</h3>,
        blockquote: ({ children }: any) => <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-400 my-4 bg-cyan-900/10 p-2">{renderContentWithVariables(children)}</blockquote>,
    };


    return (
        <div className="relative">
            {/* Tabs are not printed */}
            <div className="flex items-end gap-0 mb-0 border-b border-gray-700 no-print">
                <button onClick={() => setActiveTab('preview')} className={tabClasses('preview')}>
                    Preview Output
                </button>
                <button onClick={() => setActiveTab('edit')} className={tabClasses('edit')}>
                    Raw Markdown
                </button>
            </div>
            
            <div className="bg-[#1e293b] rounded-b-xl p-1">
                {/* Edit View (Textarea) - not printed */}
                <div className={`${activeTab === 'edit' ? 'block' : 'hidden'} no-print`}>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-96 p-4 rounded-md bg-[#0B0F19] border border-gray-700 text-cyan-100 font-mono text-sm focus:outline-none focus:border-cyan-500 resize-y leading-relaxed"
                        aria-label="Editor de Markdown"
                    />
                </div>
                
                {/* Preview View (ReactMarkdown) */}
                <div className={`${activeTab === 'preview' ? 'block' : 'hidden'} print:block bg-[#0B0F19] rounded-lg min-h-[384px] border border-gray-700`}>
                     <div className="prose-styles prompt-content-for-print p-6">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={customRenderers}
                        >
                            {value}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Editing Popover */}
            {editingVar && (
                <div 
                    className="fixed z-50 bg-[#0f172a] rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-purple-500/50 p-3 w-72 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        // Position relative to viewport using the rect
                        top: Math.max(10, editingVar.rect.top - 170) + 'px', // Above the element
                        left: Math.min(window.innerWidth - 300, Math.max(10, editingVar.rect.left)) + 'px'
                    }}
                    ref={popoverRef}
                >
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Edit Variable</span>
                        <button onClick={() => setEditingVar(null)} className="text-gray-500 hover:text-white">
                            <CloseIcon />
                        </button>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Variable Name</label>
                        <div className="flex items-center bg-[#020617] rounded border border-gray-700 px-2">
                            <span className="text-purple-500 font-mono text-sm">{`{{`}</span>
                            <input 
                                type="text" 
                                value={editingVar.name}
                                onChange={(e) => setEditingVar({...editingVar, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '')})}
                                className="bg-transparent border-none text-purple-100 text-sm w-full focus:ring-0 px-0.5 font-mono"
                            />
                            <span className="text-purple-500 font-mono text-sm">{`}}`}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Value</label>
                        <input 
                            type="text" 
                            value={editingVar.value}
                            onChange={(e) => setEditingVar({...editingVar, value: e.target.value})}
                            placeholder="Enter value..."
                            className="w-full bg-[#020617] border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    <button 
                        onClick={handleSaveVariable}
                        className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded transition-colors mt-1 uppercase tracking-wide shadow-lg shadow-purple-900/50"
                    >
                        <CheckIcon className="w-3 h-3" />
                        Update System
                    </button>

                    {/* Arrow pointing down */}
                    <div 
                        className="absolute -bottom-2 left-4 w-4 h-4 bg-[#0f172a] border-b border-r border-purple-500/50 transform rotate-45"
                        style={{ left: Math.min(270, Math.max(10, editingVar.rect.width/2)) + 'px' }} 
                    />
                </div>
            )}
        </div>
    );
};

export default MarkdownEditor;
