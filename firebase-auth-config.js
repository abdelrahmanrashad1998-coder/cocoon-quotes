// Firebase Authentication and Security Configuration
// Enhanced authentication system with proper security

// Firebase Auth configuration
const FirebaseAuth = {
    // Current user state
    currentUser: null,
    authStateListener: null,

    // Initialize authentication
    async initializeAuth() {
        try {
            // Set up auth state listener
            this.authStateListener = firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    console.log('User authenticated:', user.email);
                    this.currentUser = user;
                    
                    // Store user info in localStorage for session management
                    localStorage.setItem('currentUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        lastLogin: new Date().toISOString()
                    }));
                    
                    // Update UI to show authenticated state
                    this.updateAuthUI(true);
                } else {
                    console.log('User signed out');
                    this.currentUser = null;
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('loggedIn');
                    this.updateAuthUI(false);
                }
            });
            
            console.log('Firebase Auth initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Firebase Auth:', error);
            return false;
        }
    },

    // Sign in with email and password
    async signInWithEmail(email, password) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            console.log('User signed in successfully:', userCredential.user.email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getAuthErrorMessage(error.code) };
        }
    },

    // Create new user account
    async createUserAccount(email, password, displayName = '') {
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update display name if provided
            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName
                });
            }
            
            console.log('User account created successfully:', userCredential.user.email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Account creation error:', error);
            return { success: false, error: this.getAuthErrorMessage(error.code) };
        }
    },

    // Sign out user
    async signOut() {
        try {
            await firebase.auth().signOut();
            console.log('User signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Reset password
    async resetPassword(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            console.log('Password reset email sent');
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: this.getAuthErrorMessage(error.code) };
        }
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    },

    // Update UI based on authentication state
    updateAuthUI(isAuthenticated) {
        // Update navigation elements
        const authElements = document.querySelectorAll('.auth-required');
        const guestElements = document.querySelectorAll('.guest-only');
        
        authElements.forEach(element => {
            element.style.display = isAuthenticated ? 'block' : 'none';
        });
        
        guestElements.forEach(element => {
            element.style.display = isAuthenticated ? 'none' : 'block';
        });
        
        // Update user info display
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(element => {
            if (isAuthenticated && this.currentUser) {
                element.textContent = this.currentUser.email || this.currentUser.displayName || 'User';
            } else {
                element.textContent = 'Guest';
            }
        });
    },

    // Get user-friendly error messages
    getAuthErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/operation-not-allowed': 'This operation is not allowed.',
            'auth/invalid-credential': 'Invalid credentials. Please check your email and password.'
        };
        
        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    },

    // Clean up auth listener
    cleanup() {
        if (this.authStateListener) {
            this.authStateListener();
            this.authStateListener = null;
        }
    }
};

// Security and Access Control
const SecurityManager = {
    // User roles
    roles: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        USER: 'user',
        GUEST: 'guest'
    },

    // Default user role
    defaultRole: 'user',

    // Check if user has permission
    async hasPermission(permission) {
        try {
            const user = FirebaseAuth.getCurrentUser();
            if (!user) return false;

            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) return false;

            const userData = userDoc.data();
            const userRole = userData.role || this.defaultRole;

            return this.checkRolePermission(userRole, permission);
        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    },

    // Check role-based permissions
    checkRolePermission(role, permission) {
        const permissions = {
            'admin': ['read', 'write', 'delete', 'manage_users', 'manage_profiles', 'view_analytics'],
            'manager': ['read', 'write', 'delete', 'manage_profiles', 'view_analytics'],
            'user': ['read', 'write'],
            'guest': ['read']
        };

        return permissions[role]?.includes(permission) || false;
    },

    // Create or update user profile
    async createUserProfile(user, role = 'user') {
        try {
            // Check if user profile already exists
            const existingProfile = await db.collection('users').doc(user.uid).get();
            
            if (existingProfile.exists) {
                // Update existing profile with new login time
                await db.collection('users').doc(user.uid).update({
                    lastLogin: new Date().toISOString(),
                    isActive: true
                });
                console.log('User profile updated:', user.uid);
                return true;
            } else {
                // Create new user profile
                const userProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || '',
                    role: role,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    isActive: true
                };

                await db.collection('users').doc(user.uid).set(userProfile);
                console.log('User profile created:', user.uid);
                return true;
            }
        } catch (error) {
            console.error('Error creating/updating user profile:', error);
            return false;
        }
    },

    // Get user profile
    async getUserProfile(uid) {
        try {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    },

    // Update user profile
    async updateUserProfile(uid, updates) {
        try {
            await db.collection('users').doc(uid).update({
                ...updates,
                lastModified: new Date().toISOString()
            });
            console.log('User profile updated:', uid);
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return false;
        }
    }
};

// Enhanced database operations with security
const SecureDB = {
    // Secure quote operations
    Quotes: {
        async saveQuote(quoteData) {
            if (!(await SecurityManager.hasPermission('write'))) {
                throw new Error('Insufficient permissions to save quotes');
            }
            return await FirebaseDB.Quotes.saveQuote(quoteData);
        },

        async loadQuotes() {
            if (!(await SecurityManager.hasPermission('read'))) {
                throw new Error('Insufficient permissions to view quotes');
            }
            return await FirebaseDB.Quotes.loadQuotes();
        },

        async deleteQuote(quoteId) {
            if (!(await SecurityManager.hasPermission('delete'))) {
                throw new Error('Insufficient permissions to delete quotes');
            }
            return await FirebaseDB.Quotes.deleteQuote(quoteId);
        }
    },

    // Secure profile operations
    Profiles: {
        async saveProfiles(profiles) {
            if (!(await SecurityManager.hasPermission('manage_profiles'))) {
                throw new Error('Insufficient permissions to manage profiles');
            }
            return await FirebaseDB.Profiles.saveProfiles(profiles);
        },

        async loadProfiles() {
            if (!(await SecurityManager.hasPermission('read'))) {
                throw new Error('Insufficient permissions to view profiles');
            }
            return await FirebaseDB.Profiles.loadProfiles();
        }
    },

    // User management
    Users: {
        async createUser(userData) {
            if (!(await SecurityManager.hasPermission('manage_users'))) {
                throw new Error('Insufficient permissions to create users');
            }
            return await SecurityManager.createUserProfile(userData.user, userData.role);
        },

        async updateUser(uid, updates) {
            if (!(await SecurityManager.hasPermission('manage_users'))) {
                throw new Error('Insufficient permissions to update users');
            }
            return await SecurityManager.updateUserProfile(uid, updates);
        },

        async getUserProfile(uid) {
            if (!(await SecurityManager.hasPermission('manage_users'))) {
                throw new Error('Insufficient permissions to view user profiles');
            }
            return await SecurityManager.getUserProfile(uid);
        }
    }
};

// Export for use in other files
window.FirebaseAuth = FirebaseAuth;
window.SecurityManager = SecurityManager;
window.SecureDB = SecureDB;
