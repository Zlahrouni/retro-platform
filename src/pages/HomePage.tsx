// src/components/home/HomePage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { sessionsService } from '../services/firebaseService';
import HomeBottomSection from '../components/home/HomeBottomSection';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreateSession = async () => {
        try {
            setIsCreating(true);

            // Créer une session avec le type par défaut 'madSadGlad'
            // Nous n'avons pas besoin de nom d'utilisateur pour l'instant
            const sessionId = await sessionsService.createSession('madSadGlad', 'temp-user');

            // Rediriger vers la page de saisie du nom d'utilisateur avec l'ID de session
            navigate(`/auth/${sessionId}`);
        } catch (error) {
            console.error('Erreur lors de la création de la session:', error);
            setIsCreating(false);
        }
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
                <button
                    onClick={handleCreateSession}
                    disabled={isCreating}
                    className="w-full block text-center bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-lg"
                >
                    {isCreating ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('home.creatingSession')}
                        </div>
                    ) : (
                        t('home.createSession')
                    )}
                </button>
            </div>
            <HomeBottomSection />
        </div>
    );
};

export default HomePage;