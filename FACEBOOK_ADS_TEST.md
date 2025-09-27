# Facebook Ads Credentials Test Guide

## 🔍 **Testing Facebook Ads Auto-Save**

To verify if your app is saving Facebook Ads credentials through OAuth login, follow these steps:

### **Step 1: Check Browser Console**

1. **Open your app** in the browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Log in with Facebook**
5. **Look for these log messages:**

```
✅ Facebook pages fetched: X
✅ Facebook credentials saved successfully for page: [Page Name]
🔍 Fetching Facebook Ads credentials...
✅ Facebook Ad Account found: [Ad Account Info]
✅ Facebook Ads credentials saved successfully: [Ad Account Details]
```

### **Step 2: Check Firestore Database**

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: marketmate-101
3. **Go to Firestore Database**
4. **Navigate to**: `users/{userId}/credentials/`
5. **Look for these documents:**
   - `facebook` - Should contain page info
   - `facebook_ads` - Should contain ad account info
   - `instagram` - Should contain Instagram info (if linked)

### **Step 3: Check Credential Vault**

1. **Go to your app's Credential Vault**
2. **Look for "Facebook Ads" section**
3. **Should show:**
   - Ad Account ID
   - Ad Account Name
   - Currency
   - Page ID
   - Campaign ID (if any)

### **Step 4: Test Facebook Ad Generator**

1. **Go to Facebook Ad Generator**
2. **Try to create a campaign**
3. **Should NOT show**: "Facebook Ads credentials not found"
4. **Should allow**: Campaign creation without manual credential entry

## 🚨 **Common Issues & Solutions**

### **Issue 1: No Facebook Ads Credentials Found**

**Cause**: User doesn't have Facebook Ad Account or permissions not granted

**Solution**: 
- Make sure user has a Facebook Ad Account
- Check that `ads_management` permission is granted
- Verify Facebook App has Marketing API access

### **Issue 2: Auto-Connect Not Triggering**

**Cause**: OAuth callback not calling auto-connect function

**Solution**:
- Check browser console for errors
- Verify `signInWithFacebookAndConnect` is being called
- Check if `facebook_access_token` is stored in sessionStorage

### **Issue 3: Facebook API Errors**

**Cause**: Invalid permissions or API access

**Solution**:
- Check Facebook App permissions in Developer Console
- Verify Marketing API is enabled
- Check access token has required scopes

## 🔧 **Debug Steps**

### **Check Session Storage**
```javascript
// In browser console:
console.log('Facebook Access Token:', sessionStorage.getItem('facebook_access_token'));
```

### **Check Firestore Data**
```javascript
// In browser console (if you have Firebase SDK):
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const db = getFirestore();
const userId = 'YOUR_USER_ID';
const credentialsRef = collection(db, 'users', userId, 'credentials');
getDocs(credentialsRef).then(snapshot => {
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data());
  });
});
```

### **Test Facebook API Access**
```javascript
// In browser console:
const token = sessionStorage.getItem('facebook_access_token');
fetch(`https://graph.facebook.com/v21.0/me/adaccounts?access_token=${token}`)
  .then(response => response.json())
  .then(data => console.log('Ad Accounts:', data));
```

## ✅ **Expected Results**

After successful Facebook login, you should see:

1. **Console Logs**: All auto-connect messages
2. **Firestore**: `facebook_ads` document with ad account info
3. **Credential Vault**: Facebook Ads section populated
4. **Ad Generator**: No credential errors, can create campaigns

## 🆘 **If Still Not Working**

1. **Check Facebook App Configuration**:
   - Marketing API enabled
   - `ads_management` permission requested
   - App in Live mode

2. **Check User Permissions**:
   - User has Facebook Ad Account
   - User granted all permissions during login

3. **Check Network Tab**:
   - Facebook API calls are successful
   - No 403/401 errors

4. **Contact Support**: If all else fails, the issue might be with Facebook App configuration or user permissions.
