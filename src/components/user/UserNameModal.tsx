// src/components/user/UserNameModal.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/userService';

interface UserNameModalProps {
    onComplete: () => void;
    onCancel?: () => void;
    showCancelButton?: boolean;
}

const UserNameModal: React.FC<UserNameModalProps> = ({
                                                         onComplete,
                                                         onCancel,
                                                         showCancelButton = false
                                                     }) => {
    const { t } = useTranslation();
    const [userName, setUserName] = useState(userService.getUserName() || '');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!userName.trim()) {
            setError(t('user.nameRequired'));
            return;
        }

        // Enregistrer le nom d'utilisateur
        userService.setUserName(userName.trim());
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold mb-4">{t('user.enterYourName')}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('user.displayName')}
                        </label>
                        <input
                            type="text"
                            id="userName"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder={t('user.namePlaceholder')}
                            autoFocus
                        />
                        {error && (
                            <p className="mt-1 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        {showCancelButton && onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                {t('general.cancel')}
                            </button>
                        )}
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
                        >
                            {t('user.continue')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserNameModal;