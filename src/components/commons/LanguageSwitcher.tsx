// src/components/Commons/LanguageSwitcher.tsx
import React, { useEffect } from 'react';
import { useLanguage, SupportedLanguage } from '../../hooks/useLanguage';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
    const { currentLanguage, changeLanguage } = useLanguage();

    const handleLanguageChange = (language: SupportedLanguage) => {
        changeLanguage(language);
    };

    return (
        <div className="inline-flex rounded-md overflow-hidden shadow-sm border border-gray-200">
            <button
                type="button"
                onClick={() => handleLanguageChange('fr')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentLanguage === 'fr'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={currentLanguage === 'fr'}
            >
                FR
            </button>
            <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentLanguage === 'en'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                aria-pressed={currentLanguage === 'en'}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;