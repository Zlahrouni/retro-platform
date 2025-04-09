// src/services/userService.ts
import {
    signInAnonymously,
    updateProfile,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import {auth} from "../config/firebase";

export const userService = {
    // Se connecter anonymement (pas besoin de compte)
    async signInAnonymously(displayName?: string): Promise<string> {
        const userCredential = await signInAnonymously(auth);

        // Définir un nom d'affichage pour l'utilisateur anonyme
        if (displayName && userCredential.user) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }

        return userCredential.user.uid;
    },

    // Déconnexion
    async signOut(): Promise<void> {
        await firebaseSignOut(auth);
    },

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return auth.currentUser;
    },

    // Observer les changements d'état d'authentification
    onAuthStateChanged(callback: (user: any) => void) {
        return onAuthStateChanged(auth, callback);
    },

    // Obtenir ou définir le nom d'utilisateur local (pour les utilisateurs qui ne veulent pas s'authentifier)
    getUserName(): string {
        return localStorage.getItem('userName') || 'Anonyme';
    },

    setUserName(name: string): void {
        localStorage.setItem('userName', name);
    }
};