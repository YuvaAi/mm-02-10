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
exports.exchangeLinkedInCode = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.exchangeLinkedInCode = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const { code, redirectUri, userId: requestUserId } = req.body;
        if (!code || !redirectUri || !requestUserId) {
            res.status(400).json({
                error: 'Missing required parameters: code, redirectUri, userId'
            });
            return;
        }
        // Get LinkedIn credentials from request body or environment
        const clientId = req.body.clientId || process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = req.body.clientSecret || process.env.LINKEDIN_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            res.status(500).json({
                error: 'LinkedIn OAuth configuration missing. Please provide clientId and clientSecret in request body or set environment variables.'
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
                client_id: clientId,
                client_secret: clientSecret,
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
        // Fetch LinkedIn user profile and organization pages
        console.log('Fetching LinkedIn profile and organization pages...');
        // Get user profile using the basic profile endpoint
        // This endpoint returns the member ID in a format we can use
        const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        let profileData = await profileResponse.json();
        console.log('LinkedIn profile data:', profileData);
        if (!profileResponse.ok) {
            console.error('Failed to fetch LinkedIn profile:', profileData);
            // Return error instead of using fallback since we need a valid member ID
            res.status(400).json({
                error: 'Failed to fetch LinkedIn profile. Please ensure you have granted the required permissions.'
            });
            return;
        }
        // Extract the member ID from the id field
        // LinkedIn returns the ID in the format: "ABCD1234"
        const linkedInMemberId = profileData.id;
        // Get the first and last name from localizedFirstName and localizedLastName
        const firstName = profileData.localizedFirstName || 'LinkedIn';
        const lastName = profileData.localizedLastName || 'User';
        // Get organization pages (companies the user manages)
        let organizationPages = [];
        try {
            const orgResponse = await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });
            if (orgResponse.ok) {
                const orgData = await orgResponse.json();
                console.log('LinkedIn organization pages:', orgData);
                // Extract organization details
                if (orgData.elements && orgData.elements.length > 0) {
                    for (const element of orgData.elements) {
                        try {
                            const orgDetailsResponse = await fetch(`https://api.linkedin.com/v2/organizations/${element.organizationalTarget.split(':').pop()}`, {
                                headers: {
                                    'Authorization': `Bearer ${tokenData.access_token}`,
                                    'X-Restli-Protocol-Version': '2.0.0'
                                }
                            });
                            if (orgDetailsResponse.ok) {
                                const orgDetails = await orgDetailsResponse.json();
                                organizationPages.push({
                                    id: orgDetails.id,
                                    name: orgDetails.name,
                                    vanityName: orgDetails.vanityName,
                                    role: element.role
                                });
                            }
                        }
                        catch (orgError) {
                            console.warn('Error fetching organization details:', orgError);
                        }
                    }
                }
            }
        }
        catch (orgError) {
            console.warn('Could not fetch organization pages:', orgError);
        }
        // Use the first organization page as the primary page, or fall back to personal profile
        const primaryPage = organizationPages.length > 0 ? organizationPages[0] : null;
        // Ensure we have valid IDs
        // For personal posts, use the member ID from the 'id' field
        const pageId = primaryPage ? primaryPage.id : linkedInMemberId;
        const pageName = primaryPage ? primaryPage.name : `${firstName} ${lastName}`.trim();
        const linkedInUserId = linkedInMemberId;
        // Save LinkedIn credentials with organization page info
        const credentialData = {
            type: 'linkedin',
            accessToken: tokenData.access_token,
            // Save organization page ID if available, otherwise personal profile ID
            linkedInPageId: pageId,
            linkedInPageName: pageName,
            linkedInUserId: linkedInUserId, // Keep personal profile ID for reference
            firstName: firstName,
            lastName: lastName,
            email: '', // Email not available without r_emailaddress scope
            profilePicture: '', // Profile picture not available with basic profile
            expiresIn: tokenData.expires_in || 3600,
            scope: 'w_member_social,w_organization_social,r_liteprofile',
            // Enhanced posting capabilities based on available pages
            canPost: true,
            isDynamicUser: true,
            hasOrganizationPages: organizationPages.length > 0,
            organizationPages: organizationPages || [],
            postingCapabilities: {
                textPosts: true,
                imagePosts: true,
                videoPosts: false,
                sponsoredContent: organizationPages.length > 0, // Only if user has organization pages
                organizationPosts: organizationPages.length > 0, // Only if user has organization pages
                personalPosts: true, // Always available
                basicProfile: true
            },
            createdAt: new Date().toISOString(),
            lastValidated: new Date().toISOString()
        };
        await admin.firestore()
            .collection('users')
            .doc(requestUserId)
            .collection('credentials')
            .doc('linkedin')
            .set(credentialData);
        const fullName = `${firstName} ${lastName}`.trim();
        res.json({
            success: true,
            message: 'LinkedIn credentials saved successfully',
            accessToken: tokenData.access_token,
            expiresIn: tokenData.expires_in || 3600,
            userInfo: {
                id: pageId, // Return page ID as primary ID
                pageId: pageId,
                pageName: pageName,
                linkedInUserId: linkedInUserId, // Personal profile ID
                firstName: firstName,
                lastName: lastName,
                name: fullName,
                email: '', // Email not available without r_emailaddress scope
                canPost: true,
                postingType: primaryPage ? 'organization' : 'personal',
                hasOrganizationPages: organizationPages.length > 0,
                organizationPages: organizationPages || []
            }
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