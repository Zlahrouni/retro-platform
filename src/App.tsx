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
import Button from "./components/commons/Button";
import AdminPage from './pages/AdminPage';
import ActivityPage from './pages/ActivityPage';
import AdminAccessor from "./components/commons/AdminAccessor";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // @ts-ignore
  const { t } = useTranslation();

  return (
      <ErrorBoundary>
        <BrowserRouter>
          <AdminAccessor />
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
                      <Button
                          variant="danger"
                          onClick={() => window.location.href = '/'}
                      >
                        Retour à l'accueil
                      </Button>
                    </div>
                  }>
                    <SessionPage />
                  </ErrorBoundary>
                } />
                <Route path="/session/:sessionId/activity/:activityId" element={<ActivityPage />} />
                {/* Hidden admin route */}
                <Route path="/root-admin" element={<AdminPage />} />

                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" />} />
              </Routes>
            </main>

            <footer className="bg-white border-t py-4 mt-auto">
              <div className="container mx-auto text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} - {t('general.appName')} by <a href="https://ziadlahrouni.com" target="_blank" rel="noreferrer noopener">Ziad Lahrouni (ziadlahrouni.com)</a>
              </div>
            </footer>
            <ToastContainer position="top-right" autoClose={5000} />
          </div>
        </BrowserRouter>
      </ErrorBoundary>
  );
}

export default App;