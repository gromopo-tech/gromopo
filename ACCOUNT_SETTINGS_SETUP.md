# Account Settings with 2FA Setup Guide

This guide will help you set up and test the new account settings page with Solana wallet management and TOTP 2FA enforcement.

## Firebase Console Configuration

### 1. Enable Multi-Factor Authentication

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `production-455812`
3. Navigate to **Authentication** > **Settings** > **Multi-factor authentication**
4. Click **Enable** for Multi-factor authentication
5. Select **TOTP (Time-based One-Time Password)** as the second factor
6. Click **Save**

### 2. Deploy Updated Firestore Rules

The Firestore security rules have been updated to enforce:
- Owner role requirement
- Recent authentication (within 5 minutes)
- Multi-factor authentication for wallet updates

Deploy the updated rules:
```bash
firebase deploy --only firestore:rules
```

## Testing the Implementation

### 1. Access Account Settings

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Sign in as a business owner
3. Go to Dashboard
4. Click on "Manage Settings" in the "Account Settings" card

### 2. Test Security Flow

The security verification process will check:
1. **Recent authentication**: If you signed in more than 5 minutes ago, you'll need to re-enter your password
2. **MFA enrollment**: If you haven't set up 2FA, you'll be prompted to enroll
3. **MFA verification**: If you have 2FA but didn't use it recently, you'll need to provide a TOTP code

### 3. TOTP Enrollment Process

1. When prompted, click "Set Up 2FA"
2. Install an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
3. Scan the QR code with your authenticator app
4. Enter the 6-digit code to complete enrollment

### 4. Wallet Address Management

After passing security verification:
1. Enter a valid Solana wallet address
2. The system validates the address format using `@solana/web3.js`
3. Click "Save Wallet Address"
4. The address is securely saved via the protected API endpoint

## Security Features

### Frontend Security
- Real-time Solana address validation
- UI disabled until security verification passes
- Fresh token requirement for API calls

### Backend Security (`/api/update-wallet`)
- JWT token verification with fresh claims
- Owner role requirement
- Business ID authorization
- Recent authentication check (5 minutes)
- MFA verification requirement
- Solana address format validation

### Firestore Rules Security
- Enforces owner role in custom claims
- Requires MFA (`firebase.sign_in_second_factor`)
- Requires recent authentication (`auth_time`)
- Only allows wallet-related field updates with enhanced security

## API Endpoints

### `POST /api/update-wallet`
Securely updates the merchant wallet address.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Body:**
```json
{
  "businessId": "your-business-subdomain",
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
}
```

**Security Requirements:**
- Valid Firebase ID token
- Owner role in custom claims
- Recent authentication (< 5 minutes)
- Multi-factor authentication completed
- Valid Solana address format

## File Structure

```
src/
├── app/
│   ├── (main)/(protected)/dashboard/
│   │   └── settings/
│   │       └── page.tsx                 # Settings page
│   └── api/
│       └── update-wallet/
│           └── route.ts                 # Secure API endpoint
├── components/
│   └── protected/
│       └── dashboard/
│           ├── wallet-settings.tsx      # Main wallet component
│           ├── security-check.tsx       # Security verification
│           └── totp-enrollment.tsx      # 2FA setup
└── lib/
    └── solana/
        └── address-utils.ts             # Address validation utilities
```

## Troubleshooting

### Common Issues

1. **"Multi-factor authentication required"**
   - Ensure MFA is enabled in Firebase Console
   - Complete TOTP enrollment process

2. **"Recent authentication required"**
   - Sign out and sign in again
   - Use the password re-verification when prompted

3. **"Invalid Solana wallet address"**
   - Ensure the address is a valid base58 string
   - Typical Solana addresses are 32-44 characters long

4. **"Unauthorized access to business"**
   - Verify you're signed in as the business owner
   - Check that your custom claims include the correct role and businessId

### Development vs Production

- **Development**: Uses Firebase emulators (if running)
- **Production**: Uses live Firebase services

Ensure your Firebase configuration matches your environment.

## Next Steps

1. Test the complete flow in development
2. Deploy to staging environment
3. Test with real authenticator apps
4. Monitor error logs for any issues
5. Consider adding email notifications for wallet changes

## Security Considerations

- Wallet addresses are logged with timestamps and user IDs
- All security checks happen server-side
- MFA enrollment is required for all owners
- Consider implementing additional security measures like IP allowlists for sensitive operations
