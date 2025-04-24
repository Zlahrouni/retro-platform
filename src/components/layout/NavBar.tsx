// src/components/layout/NavBar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "../commons/LanguageSwitcher";

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
        <nav className="bg-white text-gray-800 shadow-md border-b border-gray-200">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo & Title */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center group" onClick={closeMenu}>
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-sm transition-transform duration-300 group-hover:rotate-12">
                                <span className="text-xl">R</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                                    {t('general.appName')}
                                </h1>
                                <div className="hidden sm:block text-xs text-gray-500">
                                    Rétrospectives collaboratives
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center">
                        <div className="flex items-center space-x-2 mr-4">
                            <Link
                                to="/"
                                className={`py-2 px-4 rounded-full transition-colors ${
                                    isActive('/')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {t('navigation.home')}
                            </Link>
                            <Link
                                to="/create"
                                className={`py-2 px-4 rounded-full transition-colors ${
                                    isActive('/create')
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-700 hover:bg-gray-100'
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
                            className="ml-2 inline-flex items-center justify-center p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
                            aria-expanded={isMenuOpen ? 'true' : 'false'}
                        >
                            <span className="sr-only">{t('navigation.openMenu')}</span>
                            {/* Icon when menu is closed */}
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-5 w-5`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-5 w-5`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
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
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 bg-gray-50">
                    <Link
                        to="/"
                        className={`block py-2 px-3 rounded-lg ${
                            isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={closeMenu}
                    >
                        {t('navigation.home')}
                    </Link>
                    <Link
                        to="/create"
                        className={`block py-2 px-3 rounded-lg ${
                            isActive('/create') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={closeMenu}
                    >
                        {t('navigation.newSession')}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;