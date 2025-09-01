// Firebase Configuration and Database Operations
// Replace localStorage operations with Firebase Firestore

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyALGK71HyO3bQ40mpAsCmUEOwHddjXEWNo",
    authDomain: "cocoon-aluminum-works.firebaseapp.com",
    projectId: "cocoon-aluminum-works",
    storageBucket: "cocoon-aluminum-works.firebasestorage.app",
    messagingSenderId: "29193226430",
    appId: "1:29193226430:web:c7a806149d4ff39ac5f6ef",
    measurementId: "G-429C9YTHBY"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Database operations for Quotes
const QuotesDB = {
    // Save quote to Firebase
    async saveQuote(quoteData) {
        try {
            const currentUser = firebase.auth().currentUser;
            const quoteWithMetadata = {
                ...quoteData,
                createdBy: currentUser ? currentUser.uid : null,
                createdAt: quoteData.createdAt || new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            await db.collection('quotes').doc(quoteData.id).set(quoteWithMetadata);
            console.log('Quote saved to Firebase:', quoteData.id);
            return true;
        } catch (error) {
            console.error('Error saving quote to Firebase:', error);
            throw error;
        }
    },

    // Load quotes from Firebase based on user role
    async loadQuotes() {
        try {
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                console.log('No authenticated user, cannot load quotes');
                return [];
            }

            // Get user role from Firestore
            let userRole = 'user'; // default role
            try {
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                if (userDoc.exists) {
                    userRole = userDoc.data().role || 'user';
                }
            } catch (error) {
                console.warn('Could not fetch user role, using default:', error);
            }

            let snapshot;
            if (userRole === 'admin' || userRole === 'manager') {
                // Admins and managers can see all quotes
                snapshot = await db.collection('quotes')
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                // Regular users can only see their own quotes
                snapshot = await db.collection('quotes')
                    .where('createdBy', '==', currentUser.uid)
                    .orderBy('createdAt', 'desc')
                    .get();
            }
            
            const quotes = [];
            snapshot.forEach(doc => {
                quotes.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`Loaded ${quotes.length} quotes from Firebase for ${userRole} user`);
            return quotes;
        } catch (error) {
            console.error('Error loading quotes from Firebase:', error);
            throw error;
        }
    },

    // Delete quote from Firebase
    async deleteQuote(quoteId) {
        try {
            await db.collection('quotes').doc(quoteId).delete();
            console.log('Quote deleted from Firebase:', quoteId);
            return true;
        } catch (error) {
            console.error('Error deleting quote from Firebase:', error);
            throw error;
        }
    },

    // Update quote in Firebase
    async updateQuote(quoteId, updateData) {
        try {
            await db.collection('quotes').doc(quoteId).update({
                ...updateData,
                lastModified: new Date().toISOString()
            });
            console.log('Quote updated in Firebase:', quoteId);
            return true;
        } catch (error) {
            console.error('Error updating quote in Firebase:', error);
            throw error;
        }
    }
};

// Database operations for Profiles
const ProfilesDB = {
    // Save profiles to Firebase
    async saveProfiles(profiles) {
        try {
            // Clear existing profiles and save new ones
            const batch = db.batch();
            
            // Delete existing profiles
            const existingSnapshot = await db.collection('profiles').get();
            existingSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Add new profiles
            profiles.forEach(profile => {
                const docRef = db.collection('profiles').doc();
                batch.set(docRef, profile);
            });
            
            await batch.commit();
            console.log('Profiles saved to Firebase:', profiles.length);
            return true;
        } catch (error) {
            console.error('Error saving profiles to Firebase:', error);
            throw error;
        }
    },

    // Load profiles from Firebase
    async loadProfiles() {
        try {
            const snapshot = await db.collection('profiles').get();
            const profiles = [];
            snapshot.forEach(doc => {
                profiles.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('Loaded profiles from Firebase:', profiles.length);
            return profiles;
        } catch (error) {
            console.error('Error loading profiles from Firebase:', error);
            throw error;
        }
    }
};

// Database operations for Users
const UsersDB = {
    // Save users to Firebase
    async saveUsers(users) {
        try {
            const batch = db.batch();
            
            // Clear existing users
            const existingSnapshot = await db.collection('users').get();
            existingSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Add new users
            users.forEach(user => {
                const docRef = db.collection('users').doc();
                batch.set(docRef, user);
            });
            
            await batch.commit();
            console.log('Users saved to Firebase:', users.length);
            return true;
        } catch (error) {
            console.error('Error saving users to Firebase:', error);
            throw error;
        }
    },

    // Load users from Firebase
    async loadUsers() {
        try {
            const snapshot = await db.collection('users').get();
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('Loaded users from Firebase:', users.length);
            return users;
        } catch (error) {
            console.error('Error loading users from Firebase:', error);
            throw error;
        }
    },

    // Authenticate user
    async authenticateUser(username, password) {
        try {
            const snapshot = await db.collection('users')
                .where('username', '==', username.toLowerCase())
                .where('password', '==', password)
                .get();
            
            if (!snapshot.empty) {
                const user = snapshot.docs[0].data();
                console.log('User authenticated:', user.username);
                return user;
            }
            return null;
        } catch (error) {
            console.error('Error authenticating user:', error);
            throw error;
        }
    }
};

// Real-time listeners
const FirebaseListeners = {
    // Listen for quote changes based on user role
    onQuotesChange(callback) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.log('No authenticated user, cannot set up quote listener');
            return null;
        }

        // Get user role and set up appropriate listener
        return db.collection('users').doc(currentUser.uid).get().then(userDoc => {
            let userRole = 'user';
            if (userDoc.exists) {
                userRole = userDoc.data().role || 'user';
            }

            let query;
            if (userRole === 'admin' || userRole === 'manager') {
                // Admins and managers can see all quotes
                query = db.collection('quotes').orderBy('createdAt', 'desc');
            } else {
                // Regular users can only see their own quotes
                query = db.collection('quotes')
                    .where('createdBy', '==', currentUser.uid)
                    .orderBy('createdAt', 'desc');
            }

            return query.onSnapshot(snapshot => {
                const quotes = [];
                snapshot.forEach(doc => {
                    quotes.push({ id: doc.id, ...doc.data() });
                });
                callback(quotes);
            });
        }).catch(error => {
            console.error('Error setting up quote listener:', error);
            // Fallback to user-only quotes
            return db.collection('quotes')
                .where('createdBy', '==', currentUser.uid)
                .orderBy('createdAt', 'desc')
                .onSnapshot(snapshot => {
                    const quotes = [];
                    snapshot.forEach(doc => {
                        quotes.push({ id: doc.id, ...doc.data() });
                    });
                    callback(quotes);
                });
        });
    },

    // Listen for profile changes
    onProfilesChange(callback) {
        return db.collection('profiles')
            .onSnapshot(snapshot => {
                const profiles = [];
                snapshot.forEach(doc => {
                    profiles.push({ id: doc.id, ...doc.data() });
                });
                callback(profiles);
            });
    }
};

// Migration helper functions
const MigrationHelper = {
    // Migrate existing localStorage data to Firebase
    async migrateFromLocalStorage() {
        try {
            console.log('Starting migration from localStorage to Firebase...');
            
            // Migrate quotes
            const localQuotes = JSON.parse(localStorage.getItem('cocoonQuotes') || '[]');
            if (localQuotes.length > 0) {
                for (const quote of localQuotes) {
                    await QuotesDB.saveQuote(quote);
                }
                console.log(`Migrated ${localQuotes.length} quotes`);
            }
            
            // Migrate profiles
            const localProfiles = JSON.parse(localStorage.getItem('cocoonProfiles') || '[]');
            if (localProfiles.length > 0) {
                await ProfilesDB.saveProfiles(localProfiles);
                console.log(`Migrated ${localProfiles.length} profiles`);
            }
            
            console.log('Migration completed successfully');
            return true;
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    },

    // Check if Firebase is available
    isFirebaseAvailable() {
        return typeof firebase !== 'undefined' && firebase.apps.length > 0;
    }
};

// Export for use in other files
window.FirebaseDB = {
    Quotes: QuotesDB,
    Profiles: ProfilesDB,
    Users: UsersDB,
    Listeners: FirebaseListeners,
    Migration: MigrationHelper
};
