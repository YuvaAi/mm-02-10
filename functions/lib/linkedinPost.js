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
exports.publishLinkedInPost = void 0;
const functions = __importStar(require("firebase-functions"));
exports.publishLinkedInPost = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    try {
        const { content, linkedInPageId, accessToken, isOrganizationPage } = req.body;
        if (!content || !linkedInPageId || !accessToken) {
            res.status(400).json({
                success: false,
                error: 'Missing required parameters: content, linkedInPageId, accessToken'
            });
            return;
        }
        console.log('Publishing to LinkedIn:', {
            linkedInPageId,
            isOrganizationPage,
            contentLength: content.length
        });
        // Prepare the author URN based on page type
        // For personal posts, LinkedIn expects urn:li:person:{member_id}
        // For organization posts, LinkedIn expects urn:li:organization:{org_id}
        const authorUrn = isOrganizationPage
            ? `urn:li:organization:${linkedInPageId}`
            : `urn:li:person:${linkedInPageId}`;
        console.log('Author URN:', authorUrn);
        // Prepare the post data
        const postData = {
            author: authorUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };
        console.log('LinkedIn post data:', JSON.stringify(postData, null, 2));
        // Post to LinkedIn
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(postData)
        });
        const result = await response.json();
        console.log('LinkedIn API response:', {
            status: response.status,
            statusText: response.statusText,
            result: result
        });
        if (!response.ok) {
            console.error('LinkedIn publishing failed:', result);
            res.status(response.status).json({
                success: false,
                error: result.message || result.error || 'Failed to publish to LinkedIn'
            });
            return;
        }
        const linkedInPostId = result.id;
        console.log('LinkedIn post published successfully:', linkedInPostId);
        res.json({
            success: true,
            postId: linkedInPostId,
            message: 'Successfully published to LinkedIn'
        });
    }
    catch (error) {
        console.error('LinkedIn publishing error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
//# sourceMappingURL=linkedinPost.js.map