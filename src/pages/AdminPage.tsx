// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, addDoc, updateDoc, getDocs, query, where, Timestamp, increment, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import Button from '../components/commons/Button';

interface Question {
    id: string;
    fr: string;
    en: string;
}

// Function to get basic browser info
const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    const browserInfo = {
        userAgent,
        language: navigator.language,
        platform: navigator.platform,
        vendor: navigator.vendor,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
    };
    return browserInfo;
};

const AdminPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [jsonData, setJsonData] = useState<Question[]>([]);
    const [rawJson, setRawJson] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);
    const navigate = useNavigate();

    // Check login attempts on component mount
    useEffect(() => {
        const checkAttempts = async () => {
            try {
                const attemptsRef = doc(db, 'root', 'OPGeqSH3NqqlYVnpCW97');
                const attemptsDoc = await getDoc(attemptsRef);

                if (attemptsDoc.exists()) {
                    const attempts = attemptsDoc.data().loginAttempts || 0;

                    if (attempts >= 3) {
                        setIsBlocked(true);
                        setError('Access blocked due to security measures. Please contact an administrator.');
                    }
                } else {
                    // Initialize the counter document if it doesn't exist
                    await setDoc(attemptsRef, { loginAttempts: 0 });
                }
            } catch (err) {
                console.error('Error checking login attempts:', err);
                setError('Error checking login status');
            }
        };

        checkAttempts();
    }, []);

    // Log failed attempt with user info
    const logFailedAttempt = async (attemptedPassword: string) => {
        try {
            // Create a collection for security logs
            const securityLogsCollection = collection(db, 'securityLogs');

            // Get browser info
            const browserInfo = getBrowserInfo();

            // Add entry to security logs
            await addDoc(securityLogsCollection, {
                type: 'failedLogin',
                attemptedPassword,
                browserInfo,
                timestamp: Timestamp.now(),
                page: 'adminPanel',
                actionType: 'passwordAttempt'
            });

            console.log('Security log created');
        } catch (err) {
            console.error('Error logging attempt:', err);
            // Don't show this error to user
        }
    };

    // Verify password against Firestore document
    const verifyPassword = async () => {
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        if (isBlocked) {
            setError('Access blocked due to security measures. Please contact an administrator.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Reference to the noot document with the specified ID
            const rootRef = doc(db, 'root', 'OPGeqSH3NqqlYVnpCW97');
            const rootDoc = await getDoc(rootRef);

            // Reference to the attempts counter
            const attemptsRef = doc(db, 'root', 'OPGeqSH3NqqlYVnpCW97');

            if (rootDoc.exists() && rootDoc.data().password === password) {
                // Successful login - reset attempt counter
                await updateDoc(attemptsRef, {
                    loginAttempts: 0
                });

                setIsVerified(true);
                setSuccess('Authentication successful!');
            } else {
                // Log the failed attempt with user info
                await logFailedAttempt(password);

                // Failed login - increment attempt counter
                await updateDoc(attemptsRef, {
                    loginAttempts: increment(1)
                });

                // Get updated attempts count
                const updatedAttemptsDoc = await getDoc(attemptsRef);
                const attempts = updatedAttemptsDoc.data()?.loginAttempts || 0;

                if (attempts >= 3) {
                    setIsBlocked(true);
                    setError('Access has been blocked due to security measures. Please contact an administrator.');
                } else {
                    setError('Invalid password. Please try again.');
                }
            }
        } catch (err) {
            console.error('Error verifying password:', err);
            setError('An error occurred while verifying the password');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                setRawJson(text);
                const data = JSON.parse(text);

                // Validate JSON structure
                if (!Array.isArray(data)) {
                    setError('Invalid JSON format: expected an array');
                    return;
                }

                // Validate each question
                const validQuestions = data.every(question =>
                    question.id && typeof question.id === 'string' &&
                    question.fr && typeof question.fr === 'string' &&
                    question.en && typeof question.en === 'string'
                );

                if (!validQuestions) {
                    setError('Invalid question format: each question must have id, fr, and en fields');
                    return;
                }

                setJsonData(data);
                setSuccess('JSON file successfully parsed!');
                setError(null);
            } catch (err) {
                console.error('Error parsing JSON:', err);
                setError('Invalid JSON format');
            }
        };
        reader.readAsText(file);
    };

    // Import questions to Firestore with duplication check
    const importQuestions = async () => {
        if (jsonData.length === 0) {
            setError('No questions to import');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Choose the collection to import to
            const questionsCollection = collection(db, 'questionFunExpress');

            // Step 1: Check for existing question IDs to prevent duplication
            const questionIds = jsonData.map(q => q.id);
            const duplicateResults = [];
            const newQuestions = [];

            // Check each question ID individually to identify specific duplicates
            for (const question of jsonData) {
                const q = query(questionsCollection, where("id", "==", question.id));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    // Question ID doesn't exist yet
                    newQuestions.push(question);
                } else {
                    // Question ID already exists
                    duplicateResults.push(question.id);
                }
            }

            if (duplicateResults.length > 0) {
                // Some duplicate IDs found
                if (newQuestions.length === 0) {
                    // All questions are duplicates
                    setError(`No questions imported. All question IDs already exist: ${duplicateResults.join(', ')}`);
                    setIsLoading(false);
                    return;
                } else {
                    // Some questions can be imported, some are duplicates
                    setSuccess(`Note: Skipping duplicate question IDs: ${duplicateResults.join(', ')}`);
                }
            }

            // Step 2: Add only new, non-duplicate questions
            const results = await Promise.all(
                newQuestions.map(async (question) => {
                    const docData = {
                        ...question,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now()
                    };
                    return addDoc(questionsCollection, docData);
                })
            );

            setSuccess(`Successfully imported ${results.length} questions! ${duplicateResults.length > 0 ? `Skipped ${duplicateResults.length} duplicate(s).` : ''}`);

            // Clear the data after successful import
            setJsonData([]);
            setRawJson('');
        } catch (err) {
            console.error('Error importing questions:', err);
            setError('An error occurred while importing questions');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle manual JSON entry
    const handleManualJson = () => {
        try {
            const data = JSON.parse(rawJson);

            // Validate JSON structure
            if (!Array.isArray(data)) {
                setError('Invalid JSON format: expected an array');
                return;
            }

            // Validate each question
            const validQuestions = data.every(question =>
                question.id && typeof question.id === 'string' &&
                question.fr && typeof question.fr === 'string' &&
                question.en && typeof question.en === 'string'
            );

            if (!validQuestions) {
                setError('Invalid question format: each question must have id, fr, and en fields');
                return;
            }

            setJsonData(data);
            setSuccess('JSON successfully parsed!');
            setError(null);
        } catch (err) {
            console.error('Error parsing JSON:', err);
            setError('Invalid JSON format');
        }
    };

    // Custom hook to hide the admin route from the URL
    const useHiddenRoute = () => {
        useEffect(() => {
            // Check if there's a special param in localStorage
            const isAdminMode = localStorage.getItem('adminMode') === 'true';
            if (!isAdminMode) {
                // Log unauthorized access attempt
                const logUnauthorizedAccess = async () => {
                    try {
                        const securityLogsCollection = collection(db, 'securityLogs');
                        await addDoc(securityLogsCollection, {
                            type: 'unauthorizedAccess',
                            browserInfo: getBrowserInfo(),
                            timestamp: Timestamp.now(),
                            page: 'adminPanel',
                            actionType: 'directUrlAccess'
                        });
                    } catch (err) {
                        console.error('Error logging unauthorized access:', err);
                    }
                };

                logUnauthorizedAccess();

                // If not in admin mode, redirect to home
                navigate('/');
            }
        }, [navigate]);
    };

    // Use the hook to hide this route
    useHiddenRoute();

    return (
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Super Admin Panel</h1>

            {!isVerified ? (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>

                    {isBlocked ? (
                        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
                            <div className="flex items-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="font-semibold">Access Blocked</span>
                            </div>
                            <p>Access has been blocked due to security measures. Please contact an administrator.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter admin password"
                                    disabled={isBlocked}
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Button
                                variant="primary"
                                onClick={verifyPassword}
                                disabled={isLoading || isBlocked}
                                className="px-6 py-2"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Password'}
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div>
                    {success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">Import Questions</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload JSON File
                            </label>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Or Paste JSON Directly
                            </label>
                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                rows={10}
                                placeholder='[{"id": "q1", "fr": "Question en français", "en": "Question in English"}, ...]'
                            />
                            <div className="mt-2">
                                <Button
                                    variant="secondary"
                                    onClick={handleManualJson}
                                    className="px-4 py-1 text-sm"
                                >
                                    Parse JSON
                                </Button>
                            </div>
                        </div>
                    </div>

                    {jsonData.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Parsed Questions ({jsonData.length})</h3>
                            <div className="max-h-60 overflow-y-auto bg-gray-50 p-4 rounded-md border border-gray-200">
                                {jsonData.map((question, index) => (
                                    <div
                                        key={question.id}
                                        className={`p-3 mb-2 rounded-md ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border border-gray-200`}
                                    >
                                        <div className="font-semibold">ID: {question.id}</div>
                                        <div className="text-sm"><span className="font-medium">FR:</span> {question.fr}</div>
                                        <div className="text-sm"><span className="font-medium">EN:</span> {question.en}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4">
                                <Button
                                    variant="primary"
                                    onClick={importQuestions}
                                    disabled={isLoading}
                                    className="px-6 py-2"
                                >
                                    {isLoading ? 'Importing...' : 'Import Questions to Firestore'}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/')}
                            className="px-4 py-2"
                        >
                            Return to Home
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;