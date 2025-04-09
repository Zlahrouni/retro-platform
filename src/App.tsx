// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { useTranslation } from 'react-i18next';
import HomePage from './pages/HomePage';
import CreateSessionPage from './pages/CreateSessionPage';
import SessionPage from './pages/SessionPage';
import NotFoundPage from './pages/NotFoundPage';
import NavBar from './components/layout/NavBar';

function App() {
  // @ts-ignore
  const { t } = useTranslation();

  return (
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <NavBar />

          <main className="container mx-auto p-4 flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateSessionPage />} />
              <Route path="/session/:sessionId" element={<SessionPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
          </main>

          <footer className="bg-white border-t py-4 mt-auto">
            <div className="container mx-auto text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} - {}{t('general.appName')} by <a href="https://ziadlahrouni.com" target="_blank" rel="noreferrer noopener">Ziad Lahrouni (ziadlahrouni.com)</a>
            </div>
          </footer>
        </div>
      </BrowserRouter>
  );
}

export default App;