// src/components/activities/ActivitySelector.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {ACTIVITY_COLUMNS, ActivityType} from "../../types/types";


interface ActivitySelectorProps {
    onSelect: (type: ActivityType) => void;
    initialValue?: ActivityType;
}

const ActivitySelector: React.FC<ActivitySelectorProps> = ({
                                                               onSelect,
                                                               initialValue = 'madSadGlad'
                                                           }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<ActivityType>(initialValue);

    const handleSelect = (type: ActivityType) => {
        setSelected(type);
        onSelect(type);
    };

    return (
        <div className="my-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
                {t('createSession.activityType')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(ACTIVITY_COLUMNS) as ActivityType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => handleSelect(type)}
                        className={`px-4 py-3 rounded-lg transition-colors duration-200 flex flex-col items-center justify-center text-center h-24 border-2 ${
                            selected === type
                                ? 'bg-primary text-white border-blue-600'
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                    >
            <span className="font-medium">
              {t(`activities.types.${type}`)}
            </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ActivitySelector;