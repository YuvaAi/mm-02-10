"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeLinkedInCode = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize Firebase Admin
admin.initializeApp();
exports.exchangeLinkedInCode = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d;
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const { code, redirectUri, userId } = req.body;
        if (!code || !redirectUri || !userId) {
            res.status(400).json({
                error: 'Missing required parameters: code, redirectUri, userId'
            });
            return;
        }
        // Exchange code for access token
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: functions.config().linkedin.client_id,
                client_secret: functions.config().linkedin.client_secret,
            })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error('LinkedIn token exchange failed:', tokenData);
            res.status(400).json({
                error: tokenData.error_description || 'Failed to exchange code for token'
            });
            return;
        }
        // Get user profile
        const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        const profileData = await profileResponse.json();
        if (!profileResponse.ok) {
            console.error('LinkedIn profile fetch failed:', profileData);
            res.status(400).json({
                error: 'Failed to fetch LinkedIn profile'
            });
            return;
        }
        // Save credentials to Firestore
        const credentialData = {
            type: 'linkedin',
            accessToken: tokenData.access_token,
            linkedInUserId: profileData.id,
            firstName: ((_b = (_a = profileData.firstName) === null || _a === void 0 ? void 0 : _a.localized) === null || _b === void 0 ? void 0 : _b.en_US) || '',
            lastName: ((_d = (_c = profileData.lastName) === null || _c === void 0 ? void 0 : _c.localized) === null || _d === void 0 ? void 0 : _d.en_US) || '',
            email: profileData.emailAddress,
            expiresIn: tokenData.expires_in,
            scope: tokenData.scope,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastValidated: admin.firestore.FieldValue.serverTimestamp()
        };
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('linkedin')
            .set(credentialData);
        res.json({
            success: true,
            message: 'LinkedIn credentials saved successfully'
        });
    }
    catch (error) {
        console.error('LinkedIn OAuth error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
//# sourceMappingURL=linkedinOAuth.js.map