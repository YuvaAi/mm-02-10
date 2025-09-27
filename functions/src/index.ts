import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createAdSetAndAd, createFacebookAdCampaign, createNewCampaignFunction as createNewCampaignHandler } from './facebookAds';

admin.initializeApp();

// Wrap your custom functions so they match Firebase's Callable function signature
export const createFacebookAd = functions.https.onCall(async (request) => {
  return await createAdSetAndAd(request.data, { auth: request.auth });
});

export const createFacebookAdCampaignFunction = functions.https.onCall(async (request) => {
  return await createFacebookAdCampaign(request.data, { auth: request.auth });
});

export const createNewCampaignFunction = functions.https.onCall(async (request) => {
  return await createNewCampaignHandler(request.data, { auth: request.auth });
});
