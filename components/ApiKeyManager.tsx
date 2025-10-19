import React, { useState } from 'react';
import { ApiKey } from '../types';
import { CloseIcon, KeyIcon, PlusIcon, TrashIcon, CheckIcon } from './Icons';

interface ApiKeyManagerProps {
    isOpen: boolean;
    onClose: () => void;
    keys: ApiKey[];
    activeKeyName: string | null;
    onAdd: (key: ApiKey) => void;
    onDelete: (keyName: string) => void;
    onSelect: (keyName: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
    isOpen,
    onClose,
    keys,
    activeKeyName,
    onAdd,
    onDelete,
    onSelect
}) => {
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');
    const [error, setError] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName.trim() || !newKeyValue.trim()) {
            setError('El nombre y la clave no pueden estar vacíos.');
            return;
        }
        try {
            onAdd({ name: newKeyName.trim(), key: newKeyValue.trim() });
            setNewKeyName('');
            setNewKeyValue('');
            setError('');
        } catch (err) {
            setError((err as Error).message);
        }
    };
    
    const handleSelectAndClose = (keyName: string) => {
        onSelect(keyName);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 m-4 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                        <KeyIcon />
                        Gestionar API Keys
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
                        <CloseIcon />
                    </button>
                </header>

                <div className="p-6 flex-grow overflow-y-auto">
                    {/* Add New Key Form */}
                    <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <h3 className="font-semibold text-gray-300 mb-2">Añadir Nueva Clave</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                placeholder="Nombre (Ej: Mi Proyecto)"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                            />
                            <input
                                type="password"
                                value={newKeyValue}
                                onChange={(e) => setNewKeyValue(e.target.value)}
                                placeholder="Pega tu API Key aquí"
                                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                        <button type="submit" className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                            <PlusIcon />
                            Añadir Clave
                        </button>
                    </form>

                    {/* Keys List */}
                    <div>
                        <h3 className="font-semibold text-gray-300 mb-3">Claves Guardadas</h3>
                        {keys.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No has guardado ninguna clave todavía.</p>
                        ) : (
                            <ul className="space-y-2">
                                {keys.map(key => (
                                    <li key={key.name} className="flex items-center justify-between p-3 bg-gray-700/60 rounded-lg">
                                        <span className="font-medium text-gray-200">{key.name}</span>
                                        <div className="flex items-center gap-2">
                                            {activeKeyName === key.name ? (
                                                <span className="flex items-center gap-1.5 text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-md font-semibold">
                                                    <CheckIcon className="h-4 w-4" />
                                                    Activa
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleSelectAndClose(key.name)}
                                                    className="text-xs px-2 py-1 bg-gray-600 hover:bg-blue-600 text-gray-300 hover:text-white font-semibold rounded-md transition-colors"
                                                >
                                                    Seleccionar
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => onDelete(key.name)}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                                                aria-label={`Eliminar clave ${key.name}`}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyManager;
