import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActivitySelector from '../components/activities/ActivitySelector';
import { ActivityType } from '../types/types';
import { useCreateSession } from '../hooks/useSession';

const CreateSessionPage: React.FC = () => {
    const { t } = useTranslation();
    const [activityType, setActivityType] = useState<ActivityType>('madSadGlad');
    const [userName, setUserName] = useState('');
    const { createSession, isLoading, error } = useCreateSession();

    const handleCreateSession = async () => {
        await createSession(activityType, userName);
    };

    return (
        <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-6">
                    {t('createSession.title')}
                </h1>

                <ActivitySelector onSelect={setActivityType} initialValue={activityType} />

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('createSession.enterName')}
                    </label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        // @ts-ignore
                        placeholder={t('createSession.namePlaceholder')}
                    />
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
                        // @ts-ignore
                        t('general.loading')
                    ) : (
                        // @ts-ignore
                        t('createSession.createButton')
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreateSessionPage;