# Cocoon Aluminum Works - Production System

## 🚀 **Production-Ready Files**

This folder contains the complete production system for Cocoon Aluminum Works with proper file naming and optimized structure.

## 📁 **File Structure**

### **Core Application Files**
- **`index.html`** - Main login page (entry point)
- **`dashboard.html`** - Main dashboard with quotes and user management
- **`quote-generator.html`** - Quote creation and calculation tool
- **`profile-manager.html`** - Customer profile management system
- **`admin.html`** - User management for administrators

### **Configuration Files**
- **`config.js`** - Firebase configuration and database operations
- **`auth.js`** - Authentication and security management
- **`export.js`** - PDF export functionality
- **`security-rules.txt`** - Firestore security rules for production

## 🔧 **Setup Instructions**

### **1. Firebase Configuration**
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Update `config.js` with your Firebase configuration

### **2. Security Rules**
1. Go to Firestore Database → Rules
2. Replace with contents of `security-rules.txt`
3. Click "Publish"

### **3. Create Admin User**
1. Open `index.html` and create an account
2. Go to Firebase Console → Firestore Database
3. Find your user document in `users` collection
4. Change `role` field to `"admin"`

### **4. Deploy**
Upload all files to your web server or hosting platform.

## 🎯 **Features**

### **✅ User Authentication**
- Secure login/logout system
- Password reset functionality
- Role-based access control

### **✅ Quote Management**
- Create and save quotes
- Real-time calculations
- PDF export functionality
- Quote history and management

### **✅ Profile Management**
- Customer profile database
- Import/export functionality
- Search and filter capabilities

### **✅ Admin Features**
- User management interface
- Role assignment
- System administration

### **✅ Real-time Sync**
- Firebase Firestore integration
- Multi-user collaboration
- Offline support with fallback

## 🔒 **Security**

- **Authentication Required**: All operations require valid login
- **Role-Based Access**: Different permissions for different user roles
- **Data Encryption**: Firebase handles encryption at rest and in transit
- **Secure Rules**: Firestore security rules protect all data

## 📱 **Browser Compatibility**

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🚨 **Important Notes**

1. **Firebase Configuration**: Must be updated in `config.js` before deployment
2. **Admin Setup**: First user must be manually set as admin in Firebase Console
3. **Security Rules**: Must be applied in Firebase Console for production
4. **HTTPS Required**: Production deployment requires HTTPS for security

## 📞 **Support**

For technical support or questions about the system, refer to the Firebase documentation or contact your system administrator.

---

**Cocoon Aluminum Works - Production System v1.0**
