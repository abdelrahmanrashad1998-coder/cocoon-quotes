# Firebase Troubleshooting Guide

## 🔧 **Common Issues and Solutions**

### **Issue 1: CONFIGURATION_NOT_FOUND Error**

**Error Message:**
```
FirebaseError: Firebase: Error (auth/configuration-not-found).
```

**Causes:**
1. Firebase project not properly set up
2. Authentication not enabled
3. Incorrect configuration values
4. Firebase project doesn't exist

**Solutions:**

#### **Step 1: Verify Firebase Project Setup**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Check if your project "cocoon-aluminum-works" exists
3. If not, create it with the exact name

#### **Step 2: Enable Authentication**
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Click "Save"

#### **Step 3: Verify Configuration**
1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. If no web app exists, click "Add app" and select "Web"
4. Register app with name "Cocoon Web App"
5. Copy the new configuration

#### **Step 4: Update Configuration**
Replace the configuration in `firebase-config.js`:

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

### **Issue 2: CORS Errors**

**Error Message:**
```
Access to fetch at 'https://...' from origin '...' has been blocked by CORS policy
```

**Solution:**
1. In Firebase Console, go to "Authentication"
2. Go to "Settings" tab
3. Add your domain to "Authorized domains"
4. For local development, add `localhost`

### **Issue 3: Permission Denied**

**Error Message:**
```
FirebaseError: Missing or insufficient permissions
```

**Solution:**
1. In Firebase Console, go to "Firestore Database"
2. Go to "Rules" tab
3. Temporarily set rules to test mode:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### **Issue 4: Network Errors**

**Error Message:**
```
Network request failed
```

**Solutions:**
1. Check internet connection
2. Verify Firebase project is active
3. Check if Firebase services are down
4. Try refreshing the page

## 🚀 **Quick Setup Checklist**

### **✅ Firebase Project Setup**
- [ ] Project created in Firebase Console
- [ ] Project ID matches configuration
- [ ] Project is active (not suspended)

### **✅ Authentication Setup**
- [ ] Authentication service enabled
- [ ] Email/Password provider enabled
- [ ] Authorized domains configured

### **✅ Firestore Setup**
- [ ] Firestore Database created
- [ ] Security rules configured
- [ ] Database location selected

### **✅ Configuration**
- [ ] Web app registered
- [ ] Configuration copied correctly
- [ ] API keys are valid

## 🔍 **Debug Steps**

### **Step 1: Check Browser Console**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for Firebase-related errors
4. Check network tab for failed requests

### **Step 2: Test Firebase Connection**
Add this code to test Firebase connection:

```javascript
// Test Firebase connection
firebase.apps.length ? console.log('Firebase initialized') : console.log('Firebase not initialized');

// Test Firestore connection
firebase.firestore().collection('test').doc('test').get()
    .then(() => console.log('Firestore connected'))
    .catch(err => console.error('Firestore error:', err));

// Test Auth connection
firebase.auth().signInAnonymously()
    .then(() => console.log('Auth connected'))
    .catch(err => console.error('Auth error:', err));
```

### **Step 3: Verify Configuration Values**
1. Check each configuration value matches Firebase Console
2. Ensure no extra spaces or characters
3. Verify project ID is correct
4. Check API key is valid

## 🛠️ **Alternative Solutions**

### **Solution 1: Create New Firebase Project**
If the current project has issues:

1. Create a new Firebase project
2. Enable Authentication and Firestore
3. Register a new web app
4. Update configuration with new values

### **Solution 2: Use Firebase Emulator (Development)**
For local development:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize project: `firebase init`
3. Start emulator: `firebase emulators:start`
4. Update configuration to use emulator

### **Solution 3: Fallback to localStorage**
If Firebase continues to have issues:

1. The system will automatically fall back to localStorage
2. All functionality will work locally
3. Data will be stored in browser storage
4. Can migrate to Firebase later

## 📞 **Getting Help**

### **Firebase Support**
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Status](https://status.firebase.google.com/)

### **Common Issues Database**
- [Firebase Auth Issues](https://firebase.google.com/docs/auth/troubleshooting)
- [Firestore Issues](https://firebase.google.com/docs/firestore/troubleshooting)

## 🎯 **Quick Fix Commands**

### **Reset Firebase Configuration**
```javascript
// Clear Firebase cache
firebase.app().delete();

// Reinitialize with new config
firebase.initializeApp(newFirebaseConfig);
```

### **Test Authentication**
```javascript
// Test email/password auth
firebase.auth().createUserWithEmailAndPassword('test@example.com', 'password123')
    .then(user => console.log('Auth working:', user))
    .catch(err => console.error('Auth error:', err));
```

### **Test Firestore**
```javascript
// Test Firestore write
firebase.firestore().collection('test').add({test: true})
    .then(doc => console.log('Firestore working:', doc))
    .catch(err => console.error('Firestore error:', err));
```

## ✅ **Success Indicators**

When everything is working correctly, you should see:
- ✅ "Firebase Auth initialized successfully" in console
- ✅ No CORS errors in network tab
- ✅ User registration works without errors
- ✅ Data saves to Firestore successfully
- ✅ Real-time updates work

If you're still having issues, please check the Firebase Console for any error messages or contact Firebase support.

