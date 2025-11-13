import React from 'react';
import { DynamicVariable } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface DynamicVariablesProps {
    variables: DynamicVariable[];
    onAdd: () => void;
    onUpdate: (id: string, field: 'name' | 'value', value: string) => void;
    onDelete: (id: string) => void;
}

const DynamicVariables: React.FC<DynamicVariablesProps> = ({ variables, onAdd, onUpdate, onDelete }) => {
    
    const handleNameChange = (id: string, name: string) => {
        // Allow only letters, numbers, and underscores
        const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '');
        onUpdate(id, 'name', sanitizedName);
    }

    return (
        <div className="flex flex-col gap-2">
            <div>
                <label className="font-semibold text-gray-300">Variables Dinámicas</label>
                <p className="text-xs text-gray-400">
                    Define variables para reutilizar este prompt. Úsalas en los campos de arriba con la sintaxis <code className="bg-gray-900/50 text-blue-300 px-1 py-0.5 rounded-sm text-[11px]">{`{{nombre_variable}}`}</code>.
                </p>
            </div>
            
            <div className="space-y-3 mt-2">
                {variables.map((variable, index) => (
                    <div key={variable.id} className="flex items-center gap-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={variable.name}
                                onChange={(e) => handleNameChange(variable.id, e.target.value)}
                                placeholder="nombre_variable"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                                aria-label={`Nombre de la variable ${index + 1}`}
                            />
                        </div>
                         <div className="flex-1">
                            <input
                                type="text"
                                value={variable.value}
                                onChange={(e) => onUpdate(variable.id, 'value', e.target.value)}
                                placeholder="Valor de Ejemplo"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                                aria-label={`Valor de la variable ${index + 1}`}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => onDelete(variable.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                            aria-label={`Eliminar variable ${index + 1}`}
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onAdd}
                className="flex items-center justify-center gap-2 mt-2 px-4 py-2 bg-gray-700/50 hover:bg-blue-900/50 text-gray-300 hover:text-blue-300 font-semibold rounded-lg transition-colors text-sm"
            >
                <PlusIcon />
                Añadir Variable
            </button>
        </div>
    );
};

export default DynamicVariables;