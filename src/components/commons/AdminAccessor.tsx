// src/components/commons/AdminAccessor.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// A hidden component to enable admin access via key combination
const AdminAccessor: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const konamiCode = ['KeyR', 'KeyO', 'KeyO', 'KeyT'];
        let konamiIndex = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Reset if ESC is pressed
            if (e.key === 'Escape') {
                konamiIndex = 0;
                return;
            }

            // Check if the key matches the next key in the Konami code
            const expectedKey = konamiCode[konamiIndex];
            const pressedKey = e.code || e.key;

            if (pressedKey === expectedKey) {
                konamiIndex++;

                // If the complete Konami code is entered
                if (konamiIndex === konamiCode.length) {
                    // Set admin mode and navigate to admin page
                    localStorage.setItem('adminMode', 'true');
                    navigate('/root-admin');
                    konamiIndex = 0;
                }
            } else {
                // Reset on a wrong key
                konamiIndex = 0;
            }
        };

        // Add the event listener
        document.addEventListener('keydown', handleKeyDown);

        // Clean up the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [navigate]);

    // This component doesn't render anything visible
    return null;
};

export default AdminAccessor;