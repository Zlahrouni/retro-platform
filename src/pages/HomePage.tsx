import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { sessionsService } from '../services/firebaseService';
import { userService } from '../services/userService';
import UserNameModal from '../components/user/UserNameModal';
import HomeBottomSection from '../components/home/HomeBottomSection';

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sessionCode, setSessionCode] = useState('');
    const [isHoveringCreate, setIsHoveringCreate] = useState(false);
    const [isHoveringJoin, setIsHoveringJoin] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isShaking, setIsShaking] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

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
                // Si l'utilisateur n'a pas encore défini de nom, on lui demande
                if (!userService.hasUserName()) {
                    setPendingSessionId(session.id);
                    setShowUsernameModal(true);
                    setIsJoining(false);
                    return;
                }

                navigate(`/session/${session.id}`);
                return;
            }

            // Si pas trouvé par ID, essayer par code
            const sessionByCode = await sessionsService.getSessionByCode(sessionCode.trim());

            if (sessionByCode) {
                // Si l'utilisateur n'a pas encore défini de nom, on lui demande
                if (!userService.hasUserName()) {
                    setPendingSessionId(sessionByCode.id);
                    setShowUsernameModal(true);
                    setIsJoining(false);
                    return;
                }

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

    const handleCreateClick = () => {
        // Naviguer directement vers la page de création qui gère elle-même le formulaire
        navigate('/create');
    };

    const handleUsernameComplete = () => {
        setShowUsernameModal(false);

        // Si nous avons un ID de session en attente, naviguer vers cette session
        if (pendingSessionId) {
            navigate(`/session/${pendingSessionId}`);
            setPendingSessionId(null);
        } else {
            // Sinon, naviguer vers la page de création
            navigate('/create');
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-12 px-4">
            {/* Username Modal */}
            {showUsernameModal && (
                <UserNameModal
                    onComplete={handleUsernameComplete}
                    onCancel={() => {
                        setShowUsernameModal(false);
                        setPendingSessionId(null);
                    }}
                    showCancelButton={true}
                />
            )}

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
                        <button
                            onClick={handleCreateClick}
                            className={`w-full block text-center bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 ${
                                isHoveringCreate ? 'bg-blue-700 shadow-md' : ''
                            }`}
                        >
                            {t('home.createSession')}
                        </button>
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

            {/* Utilisation du composant HomeBottomSection */}
            <HomeBottomSection />
        </div>
    );
};

export default HomePage;