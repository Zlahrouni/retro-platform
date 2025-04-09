// src/components/common/LanguageSwitcher.tsx
import React from 'react';
import { useLanguage, SupportedLanguage } from '../../hooks/useLanguage';

const LanguageSwitcher: React.FC = () => {
    const { currentLanguage, changeLanguage } = useLanguage();

    const handleLanguageChange = (language: SupportedLanguage) => {
        changeLanguage(language);
    };

    return (
        <div className="language-switcher">
            <button
                onClick={() => handleLanguageChange('fr')}
                className={currentLanguage === 'fr' ? 'active' : ''}
            >
                FR
            </button>
            <button
                onClick={() => handleLanguageChange('en')}
                className={currentLanguage === 'en' ? 'active' : ''}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;