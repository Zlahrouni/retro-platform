// src/services/userService.ts
import {onAuthStateChanged, signInAnonymously, signOut as firebaseSignOut, updateProfile} from 'firebase/auth';
import {auth} from "../config/firebase";
import {sessionsService} from './firebaseService';

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
        const savedUsername = localStorage.getItem('userName');
        if (!savedUsername || savedUsername.trim() === '') {
            console.warn("Aucun nom d'utilisateur trouvé dans localStorage");
            return '';
        }
        return savedUsername;
    },

    // Définir le nom d'utilisateur et l'ajouter à la session
    async setUserNameAndJoinSession(name: string, sessionId?: string): Promise<string | null> {
        if (!name.trim()) {
            throw new Error('Un nom d\'utilisateur est requis');
        }

        // Sauvegarder le nom d'utilisateur localement
        this.setUserName(name.trim());

        // Si un sessionId est fourni, ajouter l'utilisateur comme participant
        if (sessionId) {
            try {
                return await sessionsService.addParticipant(sessionId, name.trim());
            } catch (error) {
                console.error("Erreur lors de l'ajout à la session:", error);
                // Continuer malgré l'erreur - au moins le nom est stocké localement
                return null;
            }
        }

        return null;
    },

    // Version simple pour compatibilité avec le code existant
    setUserName(name: string): void {
        if (!name.trim()) {
            console.warn("Tentative de définition d'un nom d'utilisateur vide");
            return;
        }

        const trimmedName = name.trim();
        localStorage.setItem('userName', trimmedName);
    },

    // Vérifier si l'utilisateur a déjà défini un nom
    hasUserName(): boolean {
        const name = localStorage.getItem('userName');
        return !!name && name.trim() !== '';
    },

    // Effacer le nom d'utilisateur
    clearUserName(): void {
        localStorage.removeItem('userName');
    }
};