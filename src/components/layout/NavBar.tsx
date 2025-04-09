// src/components/layout/NavBar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../Comons/LanguageSwitcher';

const NavBar: React.FC = () => {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Fermer le menu mobile au changement de page
    const closeMenu = () => {
        if (isMenuOpen) setIsMenuOpen(false);
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <nav className="bg-white shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo & Title */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center" onClick={closeMenu}>
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-400 rounded flex items-center justify-center text-white font-bold mr-2">
                                R
                            </div>
                            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                                {t('general.appName')}
                            </h1>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center">
                        <div className="flex items-center space-x-4 mr-4">
                            <Link
                                to="/"
                                className={`py-2 px-3 rounded-md transition-colors ${
                                    isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                            >
                                {t('navigation.home')}
                            </Link>
                            <Link
                                to="/create"
                                className={`py-2 px-3 rounded-md transition-colors ${
                                    isActive('/create') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                            >
                                {t('navigation.newSession')}
                            </Link>
                        </div>
                        <LanguageSwitcher />
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <LanguageSwitcher />
                        <button
                            onClick={toggleMenu}
                            className="ml-3 inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 focus:outline-none"
                            aria-expanded={isMenuOpen ? 'true' : 'false'}
                        >
                            <span className="sr-only">Ouvrir le menu</span>
                            {/* Icon when menu is closed */}
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            {/* Icon when menu is open */}
                            <svg
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
                    <Link
                        to="/"
                        className={`block py-2 px-3 rounded-md ${
                            isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                        onClick={closeMenu}
                    >
                        Accueil
                    </Link>
                    <Link
                        to="/create"
                        className={`block py-2 px-3 rounded-md ${
                            isActive('/create') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                        onClick={closeMenu}
                    >
                        Nouvelle Session
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;