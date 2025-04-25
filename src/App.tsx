// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { useTranslation } from 'react-i18next';
import HomePage from './pages/HomePage';
import UserAuthPage from './pages/UserAuthPage';
import SessionPage from './pages/SessionPage';
import NotFoundPage from './pages/NotFoundPage';
import NavBar from './components/layout/NavBar';
import ErrorBoundary from "./components/commons/ErrorBoundary";
import ActivityPage from "./pages/ActivityPage";

function App() {
  // @ts-ignore
  const { t } = useTranslation();

  return (
      <ErrorBoundary>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <NavBar />

            <main className="container mx-auto p-4 flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth/:sessionId" element={<UserAuthPage />} />
                <Route path="/session/:sessionId" element={
                  <ErrorBoundary fallback={
                    <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-md mx-auto mt-8">
                      <p>Une erreur est survenue lors du chargement de la session.</p>
                      <button
                          onClick={() => window.location.href = '/'}
                          className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                      >
                        Retour à l'accueil
                      </button>
                    </div>
                  }>
                    <SessionPage />
                  </ErrorBoundary>
                } />
                {/* Nouvelle route pour la page d'activité */}
                <Route path="/session/:sessionId/activity/:activityId" element={
                  <ErrorBoundary fallback={
                    <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-md mx-auto mt-8">
                      <p>Une erreur est survenue lors du chargement de l'activité.</p>
                      <button
                          onClick={() => window.location.href = '/'}
                          className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                      >
                        Retour à l'accueil
                      </button>
                    </div>
                  }>
                    <ActivityPage />
                  </ErrorBoundary>
                } />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" />} />
              </Routes>
            </main>

            <footer className="bg-white border-t py-4 mt-auto">
              <div className="container mx-auto text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} - {t('general.appName')} by <a href="https://ziadlahrouni.com" target="_blank" rel="noreferrer noopener">Ziad Lahrouni (ziadlahrouni.com)</a>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </ErrorBoundary>
  );
}

export default App;