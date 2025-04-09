import React from 'react';
import { Link } from 'react-router-dom';
// Supprimez la ligne suivante si vous n'utilisez pas t
// import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
    // Supprimez cette ligne si vous n'utilisez pas t
    // const { t } = useTranslation();

    return (
        <div className="max-w-md mx-auto mt-20 text-center">
            <h1 className="text-6xl font-bold text-gray-300">404</h1>
            <h2 className="text-2xl font-bold mb-4">Page non trouvée</h2>
            <p className="text-gray-600 mb-6">
                La page que vous recherchez n'existe pas ou a été déplacée.
            </p>
            <Link
                to="/"
                className="inline-block py-2 px-4 bg-primary hover:bg-blue-600 text-white font-bold rounded transition-colors"
            >
                Retour à l'accueil
            </Link>
        </div>
    );
};

export default NotFoundPage;