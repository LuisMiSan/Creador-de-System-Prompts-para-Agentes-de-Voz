import React, { useState, useEffect } from 'react';
import { CloseIcon, CopyIcon, CheckIcon } from './Icons';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, link }) => {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsCopied(false);
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-gray-800/70 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-gray-200">Compartir Prompt</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors" aria-label="Cerrar modal">
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-6">
                    <p className="text-gray-400 mb-4 text-sm">
                        Cualquier persona con este enlace podrá ver y cargar una copia de tu prompt generado.
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={link}
                            readOnly
                            className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-300 text-sm truncate"
                            aria-label="Enlace para compartir"
                        />
                        <button
                            onClick={handleCopy}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-colors text-sm ${isCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isCopied ? <CheckIcon /> : <CopyIcon />}
                            {isCopied ? 'Copiado' : 'Copiar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
