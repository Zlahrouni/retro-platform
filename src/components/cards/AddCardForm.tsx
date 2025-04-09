// src/components/cards/AddCardForm.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AddCardFormProps {
    onSubmit: (text: string) => void;
    onCancel: () => void;
}

const AddCardForm: React.FC<AddCardFormProps> = ({ onSubmit, onCancel }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!text.trim()) return;

        setIsSubmitting(true);

        try {
            await onSubmit(text.trim());
            setText('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder={t('session.cardPlaceholder')}
          rows={3}
          disabled={isSubmitting}
      />

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    disabled={isSubmitting}
                >
                    {t('general.cancel')}
                </button>

                <button
                    type="submit"
                    className="px-3 py-1 bg-primary text-white rounded hover:bg-blue-600"
                    disabled={isSubmitting || !text.trim()}
                >
                    {isSubmitting ? t('general.loading') : t('session.submit')}
                </button>
            </div>
        </form>
    );
};

export default AddCardForm;