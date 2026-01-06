
import React, { useState } from 'react';
import { DynamicVariable } from '../types';
import { PlusIcon, TrashIcon, MicrophoneIcon } from './Icons';
import { translations, Language } from '../translations';

interface DynamicVariablesProps {
    variables: DynamicVariable[];
    onAdd: () => void;
    onUpdate: (id: string, field: 'name' | 'value', value: string) => void;
    onDelete: (id: string) => void;
    onMicClick: (fieldIdentifier: string) => void;
    listeningField: string | null;
    micSupported: boolean;
    lang: Language;
}

const DynamicVariables: React.FC<DynamicVariablesProps> = ({ variables, onAdd, onUpdate, onDelete, onMicClick, listeningField, micSupported, lang }) => {
    const [customEntryId, setCustomEntryId] = useState<string | null>(null);
    const t = translations[lang];

    // Define predefined variables inside component to use translations
    const PREDEFINED_VARIABLES = [
        { value: 'nombre_cliente', label: t.varClientName },
        { value: 'nombre_agente', label: t.varAgentName },
        { value: 'empresa_cliente', label: t.varCompany },
        { value: 'fecha_actual', label: t.varDate },
        { value: 'hora_actual', label: t.varTime },
        { value: 'numero_pedido', label: t.varOrderNum },
        { value: 'producto_servicio', label: t.varProduct },
        { value: 'motivo_llamada', label: t.varReason },
    ];
    const PREDEFINED_VALUES = PREDEFINED_VARIABLES.map(p => p.value);
    
    const handleNameChange = (id: string, name: string) => {
        // Allow only letters, numbers, and underscores
        const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '');
        onUpdate(id, 'name', sanitizedName);
    }

    return (
        <div className="flex flex-col gap-2">
            <div>
                <label className="font-semibold text-gray-800">{t.varsTitle}</label>
                <p className="text-xs text-gray-500">
                    {t.varsDesc} <code className="bg-gray-100 text-indigo-600 px-1 py-0.5 rounded-sm text-[11px] border border-gray-200">{`{{nombre_variable}}`}</code>.
                </p>
            </div>
            
            <div className="space-y-3 mt-2">
                {variables.map((variable, index) => {
                    const isPredefined = PREDEFINED_VALUES.includes(variable.name);
                    const isCustom = variable.name && !isPredefined;
                    const showCustomInput = customEntryId === variable.id || isCustom;

                    return (
                        <div key={variable.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1 relative">
                                {showCustomInput ? (
                                    <input
                                        type="text"
                                        value={variable.name}
                                        onChange={(e) => handleNameChange(variable.id, e.target.value)}
                                        placeholder={t.customVarPlaceholder}
                                        className="w-full bg-white border border-gray-300 rounded-md p-2 pr-10 text-sm text-gray-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                        aria-label={t.ariaName.replace('{0}', String(index + 1))}
                                    />
                                ) : (
                                    <select
                                        value={variable.name}
                                        onChange={(e) => {
                                            if (e.target.value === 'CUSTOM') {
                                                setCustomEntryId(variable.id);
                                                onUpdate(variable.id, 'name', '');
                                            } else {
                                                onUpdate(variable.id, 'name', e.target.value);
                                                setCustomEntryId(null);
                                            }
                                        }}
                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                                        aria-label={t.ariaSelect.replace('{0}', String(index + 1))}
                                    >
                                        <option value="" disabled>{t.selectVarPlaceholder}</option>
                                        {PREDEFINED_VARIABLES.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                        <option value="CUSTOM" className="font-bold text-indigo-600">{t.customVarOption}</option>
                                    </select>
                                )}
                                {showCustomInput && micSupported && (
                                    <button
                                        type="button"
                                        onClick={() => onMicClick(`variable-name-${variable.id}`)}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${listeningField === `variable-name-${variable.id}` ? 'text-indigo-600 bg-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                                        aria-label={t.ariaMicName.replace('{0}', String(index + 1))}
                                    >
                                        <MicrophoneIcon />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={variable.value}
                                    onChange={(e) => onUpdate(variable.id, 'value', e.target.value)}
                                    placeholder={t.valPlaceholder}
                                    className="w-full bg-white border border-gray-300 rounded-md p-2 pr-10 text-sm text-gray-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                    aria-label={t.ariaValue.replace('{0}', String(index + 1))}
                                />
                                {micSupported && (
                                    <button
                                        type="button"
                                        onClick={() => onMicClick(`variable-value-${variable.id}`)}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${listeningField === `variable-value-${variable.id}` ? 'text-indigo-600 bg-indigo-100' : 'text-gray-400 hover:text-gray-600'}`}
                                        aria-label={t.ariaMicValue.replace('{0}', String(index + 1))}
                                    >
                                        <MicrophoneIcon />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => onDelete(variable.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                aria-label={t.ariaDelete.replace('{0}', String(index + 1))}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    )
                })}
            </div>

            <button
                type="button"
                onClick={onAdd}
                className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 font-semibold rounded-lg transition-colors text-sm border border-gray-200 hover:border-indigo-200"
            >
                <PlusIcon />
                {t.addVarBtn}
            </button>
        </div>
    );
};

export default DynamicVariables;
