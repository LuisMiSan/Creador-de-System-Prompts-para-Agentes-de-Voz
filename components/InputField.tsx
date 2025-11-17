
import React from 'react';
import { MicrophoneIcon } from './Icons';

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
}) => {
    // Generate a unique ID for the input to connect the label for accessibility
    const inputId = `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    const commonInputClasses = `
        block w-full rounded-lg border appearance-none focus:outline-none focus:ring-0 peer transition-colors duration-200 
        bg-gray-700/50 border-gray-600 text-gray-200 focus:border-orange-500 group-hover:border-gray-500
        ${micSupported ? "pr-10" : ""}
    `;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative group">
                {isTextarea ? (
                    <textarea
                        id={inputId}
                        value={value}
                        onChange={onChange}
                        placeholder=" " // A space is needed for the :placeholder-shown selector to work
                        required={required}
                        rows={4}
                        className={`${commonInputClasses} px-3 pt-5 pb-2 resize-none`}
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
                    className={`absolute text-gray-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3
                               peer-placeholder-shown:scale-100
                               peer-placeholder-shown:translate-y-0
                               peer-focus:scale-75
                               peer-focus:-translate-y-3
                               peer-focus:text-orange-400
                               pointer-events-none`}
                >
                    {label} {required && <span className="text-red-400">*</span>}
                </label>

                {micSupported && (
                    <button
                        type="button"
                        onClick={onMicClick}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isListening ? 'text-orange-400 bg-orange-500/20' : 'text-gray-400 hover:text-gray-200'}`}
                        aria-label="Activar dictado por voz"
                    >
                        <MicrophoneIcon />
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-400">{helpText}</p>
        </div>
    );
};

export default InputField;