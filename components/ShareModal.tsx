
import React, { useState, useEffect } from 'react';
import { CloseIcon, CopyIcon, CheckIcon } from './Icons';
import { translations, Language } from '../translations';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: string;
    lang: Language;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, link, lang }) => {
    const [isCopied, setIsCopied] = useState(false);
    const t = translations[lang];

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
            className="fixed inset-0 bg-gray-800/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">{t.shareTitle}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors" aria-label={t.ariaClose}>
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-6">
                    <p className="text-gray-600 mb-4 text-sm">
                        {t.shareDesc}
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={link}
                            readOnly
                            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 text-sm truncate"
                            aria-label={t.linkPlaceholder}
                        />
                        <button
                            onClick={handleCopy}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg transition-colors text-sm ${isCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isCopied ? <CheckIcon /> : <CopyIcon />}
                            {isCopied ? t.copiedBtn : t.copyBtn}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
