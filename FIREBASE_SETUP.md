# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "cocoon-aluminum-works"
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web"
4. Register app with name "Cocoon Web App"
5. Copy the firebaseConfig object

## Step 4: Update Configuration

Replace the placeholder values in `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

## Step 5: Add Firebase SDK to HTML Files

Add these script tags to the `<head>` section of all HTML files:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth-compat.js"></script>

<!-- Your Firebase config -->
<script src="firebase-config.js"></script>
```

## Step 6: Enable Firebase Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

## Step 7: Security Rules (Production Ready)

In Firestore Database > Rules, replace the default rules with the production security rules from `firestore-security-rules.txt`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function hasPermission(permission) {
      let userRole = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
      let permissions = {
        'admin': ['read', 'write', 'delete', 'manage_users', 'manage_profiles', 'view_analytics'],
        'manager': ['read', 'write', 'delete', 'manage_profiles', 'view_analytics'],
        'user': ['read', 'write'],
        'guest': ['read']
      };
      return permissions[userRole] != null && permission in permissions[userRole];
    }
    
    // User profiles - users can read their own profile, admins can read all
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || hasRole('admin'));
      allow write: if isAuthenticated() && (isOwner(userId) || hasRole('admin'));
      allow create: if isAuthenticated() && hasRole('admin');
      allow delete: if isAuthenticated() && hasRole('admin');
    }
    
    // Quotes - authenticated users can read/write, admins can delete
    match /quotes/{quoteId} {
      allow read: if isAuthenticated() && hasPermission('read');
      allow create: if isAuthenticated() && hasPermission('write');
      allow update: if isAuthenticated() && hasPermission('write');
      allow delete: if isAuthenticated() && hasPermission('delete');
    }
    
    // Profiles - managers and admins can manage, all authenticated users can read
    match /profiles/{profileId} {
      allow read: if isAuthenticated() && hasPermission('read');
      allow create: if isAuthenticated() && hasPermission('manage_profiles');
      allow update: if isAuthenticated() && hasPermission('manage_profiles');
      allow delete: if isAuthenticated() && hasPermission('manage_profiles');
    }
    
    // Analytics - only managers and admins can access
    match /analytics/{docId} {
      allow read, write: if isAuthenticated() && hasPermission('view_analytics');
    }
    
    // System settings - only admins can access
    match /settings/{docId} {
      allow read, write: if isAuthenticated() && hasRole('admin');
    }
    
    // Audit logs - only admins can read
    match /audit_logs/{logId} {
      allow read: if isAuthenticated() && hasRole('admin');
      allow create: if isAuthenticated(); // All authenticated users can create logs
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**These rules implement proper role-based access control with authentication.**

## Step 8: Test Migration

1. Open your application
2. Check browser console for Firebase connection status
3. Use the migration function to move existing data:

```javascript
// In browser console
FirebaseDB.Migration.migrateFromLocalStorage();
```

## Step 9: Create Admin User

1. Open `Login.html` in your browser
2. Click "Create Account"
3. Create an admin account with email and password
4. After creation, manually update the user role in Firebase Console:
   - Go to Firestore Database
   - Find your user document in the `users` collection
   - Change the `role` field to `"admin"`

## Step 10: Test Authentication

1. Log out and log back in with your admin account
2. Test user management features
3. Verify role-based permissions work correctly
4. Test password reset functionality

## Step 11: Production Deployment

For production deployment:

1. ✅ Set up proper authentication (completed)
2. ✅ Configure security rules (completed)
3. ✅ Enable Firebase Authentication (completed)
4. ✅ Set up user roles and permissions (completed)
5. Deploy to your customer domain
6. Monitor usage and performance

## Troubleshooting

- **CORS errors**: Ensure Firebase project is properly configured
- **Permission denied**: Check Firestore security rules
- **Connection issues**: Verify API keys and project settings
