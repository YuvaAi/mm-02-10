"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeFacebookCode = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.exchangeFacebookCode = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e;
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
        // Get Facebook credentials from environment
        const clientId = process.env.FACEBOOK_APP_ID;
        const clientSecret = process.env.FACEBOOK_APP_SECRET;
        if (!clientId || !clientSecret) {
            res.status(500).json({
                error: 'Facebook OAuth configuration missing. Please set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.'
            });
            return;
        }
        // Exchange code for access token
        const tokenResponse = await fetch('https://graph.facebook.com/v21.0/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code
            })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            console.error('Facebook token exchange failed:', tokenData);
            res.status(400).json({
                error: ((_a = tokenData.error) === null || _a === void 0 ? void 0 : _a.message) || 'Failed to exchange code for token'
            });
            return;
        }
        const accessToken = tokenData.access_token;
        const expiresIn = tokenData.expires_in;
        // Get user info and pages
        const [userResponse, pagesResponse] = await Promise.all([
            fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`),
            fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`)
        ]);
        const userData = await userResponse.json();
        const pagesData = await pagesResponse.json();
        // Get Instagram business accounts
        let instagramInfo = null;
        if (pagesData.data && pagesData.data.length > 0) {
            const firstPage = pagesData.data[0];
            try {
                const instagramResponse = await fetch(`https://graph.facebook.com/v21.0/${firstPage.id}?fields=instagram_business_account&access_token=${firstPage.access_token}`);
                const instagramData = await instagramResponse.json();
                if (instagramData.instagram_business_account) {
                    const instagramAccountResponse = await fetch(`https://graph.facebook.com/v21.0/${instagramData.instagram_business_account.id}?fields=id,username&access_token=${firstPage.access_token}`);
                    const instagramAccountData = await instagramAccountResponse.json();
                    instagramInfo = instagramAccountData;
                }
            }
            catch (error) {
                console.warn('Could not fetch Instagram info:', error);
            }
        }
        // Save Facebook credentials to Firestore
        const db = admin.firestore();
        const credentialData = {
            type: 'facebook',
            accessToken: accessToken,
            pageId: ((_c = (_b = pagesData.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id) || '',
            pageName: ((_e = (_d = pagesData.data) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.name) || '',
            expiresIn: expiresIn,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastValidated: admin.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            metadata: {
                source: 'oauth',
                autoGenerated: true
            }
        };
        await db
            .collection('users')
            .doc(userId)
            .collection('credentials')
            .doc('facebook')
            .set(credentialData);
        // Save Instagram credentials if available
        if (instagramInfo) {
            const instagramCredentialData = {
                type: 'instagram',
                accessToken: accessToken,
                instagramUserId: instagramInfo.id,
                username: instagramInfo.username,
                expiresIn: expiresIn,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastValidated: admin.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                metadata: {
                    source: 'oauth',
                    autoGenerated: true
                }
            };
            await db
                .collection('users')
                .doc(userId)
                .collection('credentials')
                .doc('instagram')
                .set(instagramCredentialData);
        }
        res.json({
            success: true,
            accessToken,
            expiresIn,
            scope: tokenData.scope,
            userInfo: {
                id: userData.id,
                name: userData.name,
                email: userData.email || '',
                pages: pagesData.data || [],
                instagramInfo
            }
        });
    }
    catch (error) {
        console.error('Facebook OAuth error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});
//# sourceMappingURL=facebookOAuth.js.map