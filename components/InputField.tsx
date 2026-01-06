
import React from 'react';
import { MicrophoneIcon, SparklesIcon } from './Icons';
import { translations, Language } from '../translations';

interface InputFieldProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder: string;
    helpText: string;
    isTextarea?: boolean;
    required?: boolean;
    onMicClick?: () => void;
    isListening?: boolean;
    micSupported?: boolean;
    onAutoGenerate?: () => void;
    lang: Language; // Added lang prop
}

const InputField: React.FC<InputFieldProps> = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    helpText, 
    isTextarea = false, 
    required = false,
    onMicClick,
    isListening = false,
    micSupported = false,
    onAutoGenerate,
    lang
}) => {
    const t = translations[lang];
    const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    const commonInputClasses = `
        block w-full rounded-lg border appearance-none focus:outline-none focus:ring-0 peer transition-colors duration-200 
        bg-white border-gray-300 text-gray-900 focus:border-blue-500 group-hover:border-gray-400
        shadow-sm
        ${(micSupported || onAutoGenerate) ? "pr-20" : ""} 
    `;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative group">
                {isTextarea ? (
                    <textarea
                        id={inputId}
                        value={value}
                        onChange={onChange}
                        placeholder=" " 
                        required={required}
                        rows={4}
                        className={`${commonInputClasses} px-3 pt-6 pb-2 resize-none`}
                    />
                ) : (
                    <input
                        type="text"
                        id={inputId}
                        value={value}
                        onChange={onChange}
                        placeholder=" "
                        required={required}
                        className={`${commonInputClasses} h-14 px-3 pt-5`}
                    />
                )}
                <label
                    htmlFor={inputId}
                    className={`absolute text-blue-600 bg-white px-1 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3
                               peer-placeholder-shown:scale-100
                               peer-placeholder-shown:translate-y-0
                               peer-placeholder-shown:text-gray-500
                               peer-focus:scale-75
                               peer-focus:-translate-y-3
                               peer-focus:text-blue-600
                               pointer-events-none font-medium tracking-wide`}
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>

                <div className="absolute right-3 top-3 flex items-center gap-1">
                    {onAutoGenerate && (
                        <button
                            type="button"
                            onClick={onAutoGenerate}
                            className="p-1.5 rounded-full text-indigo-500 hover:text-white hover:bg-indigo-500 transition-colors duration-300"
                            title={t.titleAutocomplete}
                            aria-label={t.ariaGenerate}
                        >
                            <SparklesIcon />
                        </button>
                    )}

                    {micSupported && (
                        <button
                            type="button"
                            onClick={onMicClick}
                            className={`p-1.5 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-100 animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
                            aria-label={t.ariaMic}
                            title={t.titleMic}
                        >
                            <MicrophoneIcon />
                        </button>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-500 ml-1">{helpText}</p>
        </div>
    );
};

export default InputField;
