import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ActivitySelector from '../components/activities/ActivitySelector';
import { ActivityType } from '../types/types';
import { useCreateSession } from '../hooks/useSession';
import { userService } from '../services/userService';
import UserNameModal from '../components/user/UserNameModal';

const CreateSessionPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activityType, setActivityType] = useState<ActivityType>('madSadGlad');
    const [userName, setUserName] = useState(userService.getUserName());
    const { createSession, isLoading, error } = useCreateSession();
    const [showNameModal, setShowNameModal] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);

    const handleCreateSession = async () => {
        if (!userName.trim()) {
            setNameError(t('user.nameRequired'));
            return;
        }

        await createSession(activityType, userName);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserName(e.target.value);
        if (nameError && e.target.value.trim()) {
            setNameError(null);
        }
    };

    const handleUsernameComplete = () => {
        setShowNameModal(false);
        setUserName(userService.getUserName());
    };

    return (
        <div className="max-w-2xl mx-auto mt-8">
            {/* Si l'utilisateur n'a pas de nom, afficher le modal */}
            {showNameModal && (
                <UserNameModal
                    onComplete={handleUsernameComplete}
                    onCancel={() => navigate('/')}
                    showCancelButton={true}
                />
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-6">
                    {t('createSession.title')}
                </h1>

                <ActivitySelector onSelect={setActivityType} initialValue={activityType} />

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('createSession.enterName')}
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                        type="text"
                        value={userName}
                        onChange={handleNameChange}
                        className={`w-full px-3 py-2 border ${nameError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                        placeholder={t('createSession.namePlaceholder')}
                    />
                    {nameError && (
                        <p className="mt-1 text-sm text-red-600">{nameError}</p>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleCreateSession}
                    disabled={isLoading}
                    className={`w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition-colors ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? (
                        t('general.loading')
                    ) : (
                        t('createSession.createButton')
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateSessionPage;