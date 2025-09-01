# User Approval System

## 🔐 **New Security Feature: User Approval Required**

Your Cocoon Aluminum Works system now includes a **user approval system** where new users must be approved by an administrator before they can access any data or features.

## 🎯 **How It Works**

### **For New Users:**
1. **Account Creation**: When a new user creates an account, they are automatically assigned a `pending` role
2. **Waiting Period**: Pending users see a "Account Pending Approval" message instead of the dashboard
3. **No Data Access**: Pending users cannot see any quotes, profiles, or other data
4. **Status Check**: Users can check their approval status or log out and try again later

### **For Administrators:**
1. **Pending Users List**: Admins see pending users in the User Management interface
2. **Approval Options**: Admins can approve users as either:
   - **Regular User** (basic access)
   - **Manager** (elevated permissions)
3. **One-Click Approval**: Simple approval process with confirmation dialogs

## 🔧 **Technical Implementation**

### **User Roles:**
- **`pending`**: New users awaiting approval (no permissions)
- **`user`**: Regular users (read/write access)
- **`manager`**: Managers (read/write/delete + profile management)
- **`admin`**: Administrators (full access + user management)

### **Security Rules:**
- All data access requires `isApproved()` check
- Pending users have zero permissions
- Firestore rules enforce approval requirement

### **User Profile Fields:**
```javascript
{
  role: 'pending',           // Role (pending/user/manager/admin)
  status: 'pending_approval', // Status (pending_approval/approved)
  isActive: false,           // Active status
  needsApproval: true,       // Approval flag
  createdAt: '...',          // Account creation date
  approvedAt: '...',         // Approval date (set when approved)
  approvedBy: '...'          // Admin who approved
}
```

## 📋 **Admin Workflow**

### **1. Access User Management**
- Log in as admin
- Click "User Management" in dashboard
- View all users including pending ones

### **2. Review Pending Users**
- Pending users show with yellow "PENDING" badge
- Status shows "Pending Approval"
- Special approval buttons are displayed

### **3. Approve Users**
- **"Approve"** button: Approves as regular user
- **"Approve as Manager"** button: Approves with manager permissions
- Confirmation dialog prevents accidental approvals

### **4. Monitor Approved Users**
- Approved users show green "APPROVED" status
- Normal edit/delete options available
- Role can be changed later if needed

## 🛡️ **Security Benefits**

### **✅ Data Protection**
- No unauthorized access to business data
- Complete isolation of pending users
- Server-side enforcement via Firestore rules

### **✅ Controlled Access**
- Admins control who gets access
- Role-based permissions after approval
- Audit trail of approvals

### **✅ Professional Workflow**
- Proper onboarding process
- Clear approval status communication
- Professional user experience

## 🚀 **User Experience**

### **Pending Users See:**
```
┌─────────────────────────────────────┐
│           ⏰ Account Pending         │
│              Approval                │
│                                     │
│ Your account has been created       │
│ successfully, but it's currently    │
│ pending approval from an            │
│ administrator.                      │
│                                     │
│ [Logout] [Check Status]             │
└─────────────────────────────────────┘
```

### **Admins See:**
```
┌─────────────────────────────────────┐
│ John Doe                    PENDING │
│ john@example.com                    │
│ Created: 2024-01-15                │
│ Status: Pending Approval            │
│                                     │
│ [✓ Approve] [👔 Approve as Manager] │
└─────────────────────────────────────┘
```

## 🔄 **Approval Process**

1. **User registers** → Account created with `pending` role
2. **User logs in** → Sees approval waiting message
3. **Admin reviews** → Checks user management interface
4. **Admin approves** → User role changed to `user` or `manager`
5. **User logs in again** → Full access granted

## 📝 **Best Practices**

### **For Admins:**
- Review new user registrations regularly
- Verify user information before approval
- Assign appropriate roles based on user needs
- Monitor user activity after approval

### **For Users:**
- Provide complete information during registration
- Wait for approval before attempting to use the system
- Contact admin if approval takes too long
- Check approval status periodically

## 🎉 **Benefits**

- **Enhanced Security**: No unauthorized access
- **Professional Onboarding**: Controlled user access
- **Audit Trail**: Complete approval history
- **Flexible Roles**: Different permission levels
- **User-Friendly**: Clear status communication

---

**Your system is now more secure and professional!** 🔐
