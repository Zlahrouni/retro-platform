// src/pages/HomePage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HomeBottomSection from '../components/home/HomeBottomSection';
import Button from "../components/commons/Button";

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleCreateSession = () => {
        // Au lieu de créer une session, rediriger vers une route spéciale
        // qui indiquera à UserAuthPage qu'il doit créer une session
        navigate('/auth/new');
    };

    return (
        <div className="max-w-4xl mx-auto mt-12 px-4">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800 leading-tight">
                    {t('home.title')}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {t('general.slogan')}
                </p>

                {/* Divider with gradient */}
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-teal-400 mx-auto my-8 rounded-full"></div>
            </div>

            {/* Main Button */}
            <div className="max-w-lg mx-auto">
                <Button
                    variant="primary"
                    onClick={handleCreateSession}
                    className="w-full block text-center font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:shadow-lg justify-center"
                >
                    {t('home.createSession')}
                </Button>
            </div>
            <HomeBottomSection />
        </div>
    );
};

export default HomePage;