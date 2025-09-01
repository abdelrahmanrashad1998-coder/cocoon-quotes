// Firebase Authentication and Security Configuration
// Enhanced authentication system with proper security

// Early page gate: hide protected pages until auth/approval is resolved
(function gateProtectedPages() {
    try {
        if (
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === ""
        ) {
            return; // Never gate login page
        }
        //document.documentElement.style.visibility = "hidden";
        console.log(
            "Protected page gated: content hidden until approval check completes"
        );
    } catch (e) {
        console.warn("gateProtectedPages failed:", e);
    }
})();

// Firebase Auth configuration
const FirebaseAuth = {
    // Current user state
    currentUser: null,
    authStateListener: null,

    // Initialize authentication
    async initializeAuth() {
        try {
            // Set up auth state listener
            this.authStateListener = firebase
                .auth()
                .onAuthStateChanged(async (user) => {
                    if (user) {
                        console.log("User authenticated:", user.email);
                        this.currentUser = user;
                        //const userDoc = await db
                        //    .collection("users")
                        //    .doc(currentUser.uid)
                        //    .get();
                        // Store user info in localStorage for session management
                        localStorage.setItem(
                            "currentUser",
                            JSON.stringify({
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName,
                                role: userDoc.role,
                                lastLogin: new Date().toISOString(),
                            })
                        );

                        // Update UI to show authenticated state
                        this.updateAuthUI(true);

                        // After successful authentication, enforce pending-user block on protected pages
                        try {
                            if (
                                !(
                                    window.location.pathname.includes(
                                        "index.html"
                                    ) ||
                                    window.location.pathname.endsWith("/") ||
                                    window.location.pathname === ""
                                )
                            ) {
                                const isBlocked =
                                    await SecurityManager.checkAndBlockPendingUser();
                                if (!isBlocked) {
                                    // Approved user: reveal content
                                    SecurityManager.revealContent();
                                } else {
                                    // Pending user blocked; keep content replaced by blocker
                                    return;
                                }
                            }
                        } catch (e) {
                            console.warn("Post-auth pending check failed:", e);
                            // On error, reveal content to avoid locking out approved users
                            SecurityManager.revealContent();
                        }
                    } else {
                        console.log("User signed out");
                        this.currentUser = null;
                        localStorage.removeItem("currentUser");
                        localStorage.removeItem("loggedIn");
                        this.updateAuthUI(false);
                    }
                });

            console.log("Firebase Auth initialized successfully");
            return true;
        } catch (error) {
            console.error("Error initializing Firebase Auth:", error);
            return false;
        }
    },

    // Sign in with email and password
    async signInWithEmail(email, password) {
        try {
            const userCredential = await firebase
                .auth()
                .signInWithEmailAndPassword(email, password);
            console.log(
                "User signed in successfully:",
                userCredential.user.email
            );
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Sign in error:", error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error.code),
            };
        }
    },

    // Create new user account
    async createUserAccount(email, password, displayName = "") {
        try {
            const userCredential = await firebase
                .auth()
                .createUserWithEmailAndPassword(email, password);

            // Update display name if provided
            if (displayName) {
                await userCredential.user.updateProfile({
                    displayName: displayName,
                });
            }

            console.log(
                "User account created successfully:",
                userCredential.user.email
            );
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error("Account creation error:", error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error.code),
            };
        }
    },

    // Sign out user
    async signOut() {
        try {
            await firebase.auth().signOut();
            console.log("User signed out successfully");
            return { success: true };
        } catch (error) {
            console.error("Sign out error:", error);
            return { success: false, error: error.message };
        }
    },

    // Reset password
    async resetPassword(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            console.log("Password reset email sent");
            return { success: true };
        } catch (error) {
            console.error("Password reset error:", error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error.code),
            };
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
        const authElements = document.querySelectorAll(".auth-required");
        const guestElements = document.querySelectorAll(".guest-only");

        authElements.forEach((element) => {
            element.style.display = isAuthenticated ? "block" : "none";
        });

        guestElements.forEach((element) => {
            element.style.display = isAuthenticated ? "none" : "block";
        });

        // Update user info display
        const userInfoElements = document.querySelectorAll(".user-info");
        userInfoElements.forEach((element) => {
            if (isAuthenticated && this.currentUser) {
                element.textContent =
                    this.currentUser.email ||
                    this.currentUser.displayName ||
                    "User";
            } else {
                element.textContent = "Guest";
            }
        });
    },

    // Get user-friendly error messages
    getAuthErrorMessage(errorCode) {
        const errorMessages = {
            "auth/user-not-found": "No account found with this email address.",
            "auth/wrong-password": "Incorrect password. Please try again.",
            "auth/invalid-email": "Please enter a valid email address.",
            "auth/weak-password":
                "Password should be at least 6 characters long.",
            "auth/email-already-in-use":
                "An account with this email already exists.",
            "auth/too-many-requests":
                "Too many failed attempts. Please try again later.",
            "auth/network-request-failed":
                "Network error. Please check your connection.",
            "auth/user-disabled": "This account has been disabled.",
            "auth/operation-not-allowed": "This operation is not allowed.",
            "auth/invalid-credential":
                "Invalid credentials. Please check your email and password.",
        };

        return (
            errorMessages[errorCode] || "An error occurred. Please try again."
        );
    },

    // Clean up auth listener
    cleanup() {
        if (this.authStateListener) {
            this.authStateListener();
            this.authStateListener = null;
        }
    },
};

// Security and Access Control
const SecurityManager = {
    // User roles
    roles: {
        ADMIN: "admin",
        MANAGER: "manager",
        USER: "user",
        GUEST: "guest",
    },

    // Default user role
    defaultRole: "user",

    // Check if user has permission
    async hasPermission(permission) {
        try {
            const user = FirebaseAuth.getCurrentUser();
            if (!user) return false;

            const userDoc = await db.collection("users").doc(user.uid).get();
            if (!userDoc.exists) return false;

            const userData = userDoc.data();
            const userRole = userData.role || this.defaultRole;

            return this.checkRolePermission(userRole, permission);
        } catch (error) {
            console.error("Permission check error:", error);
            return false;
        }
    },

    // Check role-based permissions
    checkRolePermission(role, permission) {
        const permissions = {
            admin: [
                "read",
                "write",
                "delete",
                "manage_users",
                "manage_profiles",
                "view_analytics",
            ],
            manager: [
                "read",
                "write",
                "delete",
                "manage_profiles",
                "view_analytics",
            ],
            user: ["read", "write"],
            guest: ["read"],
            pending: [], // Pending users have no permissions
        };

        return permissions[role]?.includes(permission) || false;
    },

    // Create or update user profile
    async createUserProfile(user, role = "pending") {
        try {
            // Check if user profile already exists
            const existingProfile = await db
                .collection("users")
                .doc(user.uid)
                .get();

            if (existingProfile.exists) {
                // Update existing profile with new login time
                await db.collection("users").doc(user.uid).update({
                    lastLogin: new Date().toISOString(),
                    isActive: true,
                });
                console.log("User profile updated:", user.uid);
                return true;
            } else {
                // Create new user profile with 'pending' role - requires admin approval
                const userProfile = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || "",
                    role: "pending", // New users start with pending role
                    status: "pending_approval", // Additional status field
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    isActive: false, // Inactive until approved
                    needsApproval: true, // Flag for admin interface
                };

                await db.collection("users").doc(user.uid).set(userProfile);
                console.log(
                    "User profile created with pending role:",
                    user.uid
                );
                return true;
            }
        } catch (error) {
            console.error("Error creating/updating user profile:", error);
            return false;
        }
    },

    // Get user profile
    async getUserProfile(uid) {
        try {
            const userDoc = await db.collection("users").doc(uid).get();
            if (userDoc.exists) {
                return userDoc.data();
            }
            return null;
        } catch (error) {
            console.error("Error getting user profile:", error);
            return null;
        }
    },

    // Update user profile
    async updateUserProfile(uid, updates) {
        try {
            await db
                .collection("users")
                .doc(uid)
                .update({
                    ...updates,
                    lastModified: new Date().toISOString(),
                });
            console.log("User profile updated:", uid);
            return true;
        } catch (error) {
            console.error("Error updating user profile:", error);
            return false;
        }
    },

    // Check if user is approved and active
    async isUserApproved(uid) {
        try {
            const userDoc = await db.collection("users").doc(uid).get();
            if (!userDoc.exists) return false;

            const userData = userDoc.data();
            console.log("User data for approval check:", userData);
            localStorage.setItem("role", userData.role);

            // Check if user is not pending and is active (or active field doesn't exist, which means active)
            const isApproved =
                userData.role !== "pending" && userData.isActive !== false;
            console.log(
                "User approval status:",
                isApproved,
                "Role:",
                userData.role,
                "Active:",
                userData.isActive
            );
            return isApproved;
        } catch (error) {
            console.error("Error checking user approval status:", error);
            return false;
        }
    },

    // Approve a pending user
    async approveUser(uid, newRole = "user") {
        try {
            await db
                .collection("users")
                .doc(uid)
                .update({
                    role: newRole,
                    status: "approved",
                    isActive: true,
                    needsApproval: false,
                    approvedAt: new Date().toISOString(),
                    approvedBy: FirebaseAuth.getCurrentUser()?.uid || "admin",
                });
            console.log("User approved:", uid, "with role:", newRole);
            return true;
        } catch (error) {
            console.error("Error approving user:", error);
            return false;
        }
    },

    // Check if current user is pending and show blocking message
    async checkAndBlockPendingUser() {
        try {
            console.log("=== CHECKING USER APPROVAL STATUS ===");
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                console.log("No current user found");
                return false; // Not logged in, allow access to login page
            }

            console.log("Current user found:", currentUser.email);
            const isApproved = await this.isUserApproved(currentUser.uid);
            console.log("Approval check result:", isApproved);

            if (!isApproved) {
                console.log("User is NOT approved - BLOCKING ACCESS");
                // Block immediately - don't wait for page to load
                this.showPendingApprovalMessage();
                return true; // User is blocked
            }

            console.log("User is approved - allowing access");
            return false; // User is approved
        } catch (error) {
            console.error("Error checking user approval status:", error);
            // If there's an error checking approval, don't block - let user access normally
            return false;
        }
    },

    // Show pending approval message and block all content
    showPendingApprovalMessage() {
        // Hide ALL HTML content completely
        const body = document.body;
        const html = document.documentElement;

        // Hide the entire page content
        body.style.display = "none";

        // Create a new body with only the pending message
        const newBody = document.createElement("body");
        newBody.style.margin = "0";
        newBody.style.padding = "0";
        newBody.style.fontFamily = "Montserrat, sans-serif";

        // Remove the old body and add the new one
        html.removeChild(body);
        html.appendChild(newBody);

        // Create the complete pending message page with Cocoon branding
        newBody.innerHTML = `
            <div id="pending-approval-message" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #A72036 0%, #F9BC77 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Montserrat', sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 500px;
                    width: 90%;
                    border-top: 4px solid #A72036;
                ">
                    <div style="
                        font-size: 48px;
                        margin-bottom: 20px;
                        color: #F9BC77;
                    ">⏰</div>
                    
                    <h2 style="
                        color: #A72036;
                        margin-bottom: 15px;
                        font-size: 24px;
                        font-weight: 600;
                    ">Account Pending Approval</h2>
                    
                    <p style="
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 25px;
                        font-size: 16px;
                    ">
                        Your account has been created successfully, but it's currently pending approval from an administrator.
                        <br><br>
                        You'll be able to access all features once your account is approved.
                    </p>
                    
                    <div style="
                        display: flex;
                        gap: 15px;
                        justify-content: center;
                        flex-wrap: wrap;
                    ">
                        <button onclick="SecurityManager.logout()" style="
                            background: #A72036;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.3s;
                        ">Logout</button>
                        
                        <button onclick="location.reload()" style="
                            background: #F9BC77;
                            color: #303038;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.3s;
                        ">Check Status</button>
                    </div>
                    
                    <p style="
                        color: #999;
                        font-size: 14px;
                        margin-top: 20px;
                    ">
                        If you believe this is an error, please contact your administrator.
                    </p>
                </div>
            </div>
        `;

        console.log(
            "Pending approval message displayed - user blocked from accessing content"
        );
    },

    // Temporarily hide protected page content until auth/approval check resolves
    preHideProtectedPage() {
        try {
            if (
                window.location.pathname.includes("index.html") ||
                window.location.pathname.endsWith("/") ||
                window.location.pathname === ""
            ) {
                return; // Never hide login page
            }
            document.documentElement.style.visibility = "hidden";
        } catch (e) {
            console.warn("preHideProtectedPage failed:", e);
        }
    },

    // Reveal page content for approved/authenticated users
    revealContent() {
        try {
            document.documentElement.style.visibility = "";
        } catch (e) {
            console.warn("revealContent failed:", e);
        }
    },

    // Force block pending users - can be called from any page
    forceBlockPendingUsers() {
        console.log("=== FORCE BLOCKING PENDING USERS ===");

        // Check if we're on the login page
        if (
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === ""
        ) {
            console.log("Login page, not blocking");
            return;
        }

        // Only block if user is properly authenticated via Firebase
        if (
            typeof FirebaseAuth === "undefined" ||
            !FirebaseAuth.isAuthenticated()
        ) {
            console.log("User not properly authenticated, not blocking");
            return;
        }

        // Show blocking message immediately
        console.log("User is properly authenticated, checking if pending...");
        this.checkAndBlockPendingUser();
    },

    // Logout function for pending users
    logout() {
        try {
            FirebaseAuth.signOut();
            localStorage.removeItem("loggedIn");
            localStorage.removeItem("loginTime");
            localStorage.removeItem("currentUser");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error during logout:", error);
            window.location.href = "index.html";
        }
    },
};

// Immediate blocking check for pending users - waits for proper authentication
(async function immediateBlockingCheck() {
    try {
        console.log("=== IMMEDIATE BLOCKING CHECK STARTED ===");

        // Check if we're on the login page (don't block login page)
        if (
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === ""
        ) {
            console.log("Login page detected, allowing access");
            return; // Allow access to login page
        }

        console.log("Not login page, waiting for Firebase Auth...");

        // Wait for Firebase Auth to be available
        if (typeof FirebaseAuth === "undefined") {
            console.log("FirebaseAuth not available yet, will retry...");
            // Retry after a longer delay
            setTimeout(immediateBlockingCheck, 2000);
            return;
        }

        console.log("FirebaseAuth available, waiting for authentication...");

        // Wait for user to be properly authenticated
        if (!FirebaseAuth.isAuthenticated()) {
            console.log(
                "User not authenticated yet, allowing page to load normally"
            );
            return;
        }

        console.log("User is authenticated, checking if pending...");

        // Check if user is pending and block immediately
        if (typeof SecurityManager !== "undefined") {
            const isBlocked = await SecurityManager.checkAndBlockPendingUser();
            if (isBlocked) {
                console.log("User blocked - pending approval");
                return; // Stop all further execution
            } else {
                console.log("User is approved, revealing content");
                SecurityManager.revealContent();
            }
        } else {
            console.log("SecurityManager not available yet");
            SecurityManager.revealContent();
        }
    } catch (error) {
        console.error("Error in immediate blocking check:", error);
        // Don't block on error - let the page load normally
    }
})();

// Force blocking check on page load - waits for proper authentication
window.addEventListener("load", async function () {
    try {
        console.log("=== PAGE LOAD BLOCKING CHECK ===");

        // Check if we're on the login page (don't block login page)
        if (
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === ""
        ) {
            console.log("Login page detected, allowing access");
            return; // Allow access to login page
        }

        console.log("Not login page, waiting for Firebase Auth...");

        // Wait for Firebase Auth to be available
        if (typeof FirebaseAuth === "undefined") {
            console.log(
                "FirebaseAuth not available on page load, allowing page to load normally"
            );
            return;
        }

        console.log("FirebaseAuth available, checking authentication...");

        // Only check if user is properly authenticated
        if (!FirebaseAuth.isAuthenticated()) {
            console.log(
                "User not authenticated on page load, allowing page to load normally"
            );
            return;
        }

        console.log(
            "User is authenticated on page load, checking if pending..."
        );

        // Check if user is pending and block immediately
        if (typeof SecurityManager !== "undefined") {
            const isBlocked = await SecurityManager.checkAndBlockPendingUser();
            if (isBlocked) {
                console.log("User blocked on page load - pending approval");
                return; // Stop all further execution
            } else {
                console.log("User is approved on page load, revealing content");
                SecurityManager.revealContent();
            }
        } else {
            console.log("SecurityManager not available on page load");
            SecurityManager.revealContent();
        }
    } catch (error) {
        console.error("Error in page load blocking check:", error);
    }
});

// DOM ready blocking check - waits for proper authentication
document.addEventListener("DOMContentLoaded", async function () {
    try {
        console.log("=== DOM READY BLOCKING CHECK ===");

        // Check if we're on the login page (don't block login page)
        if (
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === ""
        ) {
            console.log("Login page detected, allowing access");
            return; // Allow access to login page
        }

        console.log("Not login page, waiting for Firebase Auth...");

        // Wait for Firebase Auth to be available
        if (typeof FirebaseAuth === "undefined") {
            console.log(
                "FirebaseAuth not available yet, allowing page to load normally"
            );
            return;
        }

        console.log("FirebaseAuth available, checking authentication...");

        // Only check if user is properly authenticated
        if (!FirebaseAuth.isAuthenticated()) {
            console.log(
                "User not authenticated yet, allowing page to load normally"
            );
            return;
        }

        console.log("User is authenticated, checking if pending...");

        // Check if user is pending and block immediately
        if (typeof SecurityManager !== "undefined") {
            const isBlocked = await SecurityManager.checkAndBlockPendingUser();
            if (isBlocked) {
                console.log("User blocked on DOM ready - pending approval");
                return; // Stop all further execution
            } else {
                console.log("User is approved, revealing content");
                SecurityManager.revealContent();
            }
        } else {
            console.log("SecurityManager not available yet");
            SecurityManager.revealContent();
        }
    } catch (error) {
        console.error("Error in DOM ready blocking check:", error);
        // Don't block on error - let the page load normally
    }
});

// Force immediate blocking for pending users - runs before anything else
(function () {
    console.log("=== FORCE BLOCKING CHECK - IMMEDIATE ===");

    // Check if we're on the login page
    if (
        window.location.pathname.includes("index.html") ||
        window.location.pathname.endsWith("/") ||
        window.location.pathname === ""
    ) {
        console.log("Login page, allowing access");
        return;
    }

    // Don't block immediately - wait for proper authentication
    console.log("Not login page, waiting for proper authentication...");
})();

// Continuous blocking check - runs every 5 seconds, only after proper authentication
setInterval(() => {
    try {
        // Check if we're on the login page
        if (
            window.location.pathname.includes("index.html") ||
            window.location.pathname.endsWith("/") ||
            window.location.pathname === ""
        ) {
            return; // Don't block login page
        }

        // Only check if Firebase Auth is properly initialized and user is authenticated
        if (
            typeof FirebaseAuth === "undefined" ||
            !FirebaseAuth.isAuthenticated()
        ) {
            return; // Don't block if not properly authenticated
        }

        // Check if blocking message is already shown
        const blockingMessage = document.getElementById(
            "pending-approval-message"
        );
        if (blockingMessage) {
            return; // Already blocked
        }

        // Only check if SecurityManager is available and user is authenticated
        if (
            typeof SecurityManager !== "undefined" &&
            FirebaseAuth.getCurrentUser()
        ) {
            SecurityManager.checkAndBlockPendingUser();
        }
    } catch (error) {
        console.error("Error in continuous blocking check:", error);
    }
}, 5000); // Reduced frequency to 5 seconds

// Enhanced database operations with security
const SecureDB = {
    // Secure quote operations
    Quotes: {
        async saveQuote(quoteData) {
            if (!(await SecurityManager.hasPermission("write"))) {
                throw new Error("Insufficient permissions to save quotes");
            }
            return await FirebaseDB.Quotes.saveQuote(quoteData);
        },

        async loadQuotes() {
            if (!(await SecurityManager.hasPermission("read"))) {
                throw new Error("Insufficient permissions to view quotes");
            }
            return await FirebaseDB.Quotes.loadQuotes();
        },

        async deleteQuote(quoteId) {
            if (!(await SecurityManager.hasPermission("delete"))) {
                throw new Error("Insufficient permissions to delete quotes");
            }
            return await FirebaseDB.Quotes.deleteQuote(quoteId);
        },
    },

    // Secure profile operations
    Profiles: {
        async saveProfiles(profiles) {
            if (!(await SecurityManager.hasPermission("manage_profiles"))) {
                throw new Error("Insufficient permissions to manage profiles");
            }
            return await FirebaseDB.Profiles.saveProfiles(profiles);
        },

        async loadProfiles() {
            if (!(await SecurityManager.hasPermission("read"))) {
                throw new Error("Insufficient permissions to view profiles");
            }
            return await FirebaseDB.Profiles.loadProfiles();
        },
    },

    // User management
    Users: {
        async createUser(userData) {
            if (!(await SecurityManager.hasPermission("manage_users"))) {
                throw new Error("Insufficient permissions to create users");
            }
            return await SecurityManager.createUserProfile(
                userData.user,
                userData.role
            );
        },

        async updateUser(uid, updates) {
            if (!(await SecurityManager.hasPermission("manage_users"))) {
                throw new Error("Insufficient permissions to update users");
            }
            return await SecurityManager.updateUserProfile(uid, updates);
        },

        async getUserProfile(uid) {
            if (!(await SecurityManager.hasPermission("manage_users"))) {
                throw new Error(
                    "Insufficient permissions to view user profiles"
                );
            }
            return await SecurityManager.getUserProfile(uid);
        },
    },
};

// Export for use in other files
window.FirebaseAuth = FirebaseAuth;
window.SecurityManager = SecurityManager;
window.SecureDB = SecureDB;
