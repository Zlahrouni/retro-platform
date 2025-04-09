import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { sessionsService } from '../services/firebaseService';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sessionCode, setSessionCode] = useState('');
    const [isHoveringCreate, setIsHoveringCreate] = useState(false);
    const [isHoveringJoin, setIsHoveringJoin] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isShaking, setIsShaking] = useState(false);

    // Effet pour gérer l'animation de secousse
    useEffect(() => {
        if (isShaking) {
            const timer = setTimeout(() => {
                setIsShaking(false);
            }, 500); // Durée de l'animation
            return () => clearTimeout(timer);
        }
    }, [isShaking]);

    const handleJoinSession = async () => {
        if (!sessionCode.trim()) return;

        setIsJoining(true);
        setJoinError(null);

        try {
            // D'abord, essayer de trouver la session par son ID directement
            const session = await sessionsService.getSessionById(sessionCode.trim());

            if (session) {
                navigate(`/session/${session.id}`);
                return;
            }

            // Si pas trouvé par ID, essayer par code
            const sessionByCode = await sessionsService.getSessionByCode(sessionCode.trim());

            if (sessionByCode) {
                navigate(`/session/${sessionByCode.id}`);
                return;
            }

            // Si la session n'existe pas, faire vibrer la carte et afficher l'erreur
            setIsShaking(true);
            setJoinError(t('home.sessionNotFound'));
        } catch (error) {
            setIsShaking(true);
            console.error('Error joining session:', error);
            setJoinError(t('home.errorJoiningSession'));
        } finally {
            setIsJoining(false);
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
                    Simplifiez vos rétrospectives d'équipe avec une plateforme collaborative en temps réel
                </p>

                {/* Divider with gradient */}
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-teal-400 mx-auto my-8 rounded-full"></div>
            </div>

            {/* Cards Section */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                {/* Create Session Card */}
                <div
                    className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1"
                    onMouseEnter={() => setIsHoveringCreate(true)}
                    onMouseLeave={() => setIsHoveringCreate(false)}
                >
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <div className="p-8">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5 text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">
                            {t('home.createSession')}
                        </h2>
                        <p className="mb-8 text-gray-600 leading-relaxed">
                            {t('home.createSessionDescription')}
                        </p>
                        <Link
                            to="/create"
                            className={`w-full block text-center bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 ${
                                isHoveringCreate ? 'bg-blue-700 shadow-md' : ''
                            }`}
                        >
                            {t('home.createSession')}
                        </Link>
                    </div>
                </div>

                {/* Join Session Card */}
                <div
                    className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1 ${
                        isShaking ? 'animate-shake' : ''
                    }`}
                    onMouseEnter={() => setIsHoveringJoin(true)}
                    onMouseLeave={() => setIsHoveringJoin(false)}
                >
                    <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-500"></div>
                    <div className="p-8">
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-5 text-teal-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">
                            {t('home.joinSession')}
                        </h2>
                        <p className="mb-6 text-gray-600 leading-relaxed">
                            Rejoignez une session existante et partagez vos réflexions avec l'équipe
                        </p>

                        {joinError && (
                            <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
                                {joinError}
                            </div>
                        )}

                        <div className="flex mt-2">
                            <input
                                type="text"
                                value={sessionCode}
                                onChange={(e) => setSessionCode(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder={t('home.sessionCodePlaceholder')}
                                disabled={isJoining}
                            />
                            <button
                                onClick={handleJoinSession}
                                disabled={isJoining || !sessionCode.trim()}
                                className={`bg-teal-500 text-white font-medium py-3 px-6 rounded-r-lg transition-all duration-300 flex items-center justify-center ${
                                    isHoveringJoin ? 'bg-teal-600 shadow-md' : ''
                                } ${isJoining || !sessionCode.trim() ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isJoining ? (
                                    // Icône de chargement
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        {t('home.joinButton')}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-16 text-center">
                <p className="text-gray-500 text-sm">
                    Plateforme simple et intuitive pour des rétrospectives efficaces
                </p>
                <div className="flex justify-center space-x-10 mt-6">
                    <div className="flex flex-col items-center">
                        <div className="text-blue-600 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-600">Temps réel</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-blue-600 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-600">Sécurisé</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-blue-600 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </div>
                        <span className="text-sm text-gray-600">Intuitif</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;