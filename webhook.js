const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(bodyParser.urlencoded({ extended: true }));

// Your webhook verification token (set this in Meta Developer Console)
const VERIFY_TOKEN = 'your_webhook_verify_token_here';

// Your app secret (for signature verification)
const APP_SECRET = 'your_app_secret_here';

/**
 * Verify that the callback came from Meta using signature verification
 */
function verifyRequestSignature(req, res, buf) {
  const signature = req.headers['x-hub-signature-256'];
  
  if (!signature) {
    console.warn('⚠️ No signature found in request');
    return;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', APP_SECRET)
    .update(buf)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('❌ Invalid signature:', {
      expected: expectedSignature,
      received: signature
    });
    throw new Error('Invalid signature');
  }

  console.log('✅ Request signature verified');
}

/**
 * Meta Webhook Handler
 * Handles both verification and event processing for Facebook/Instagram webhooks
 */
app.get('/webhook', (req, res) => {
  console.log('🔍 Webhook verification request received');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Verification details:', {
    mode,
    token,
    challenge
  });

  // Check if mode and token are correct
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed:', {
      expectedToken: VERIFY_TOKEN,
      receivedToken: token,
      mode
    });
    res.status(403).send('Forbidden');
  }
});

app.post('/webhook', (req, res) => {
  console.log('📦 Webhook event received');
  
  try {
    const body = req.body;
    console.log('📦 Event body:', JSON.stringify(body, null, 2));

    // Process different types of events
    if (body.object === 'instagram' || body.object === 'page') {
      for (const entry of body.entry || []) {
        processEntry(entry);
      }
    }

    // Always respond with 200 OK to Meta
    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing webhook event:', error);
    // Still respond with 200 to prevent Meta from retrying
    res.status(200).send('OK');
  }
});

/**
 * Process individual webhook entries
 */
function processEntry(entry) {
  console.log('📋 Processing entry:', entry.id);

  // Handle different types of events
  if (entry.messaging) {
    // Handle messaging events (comments, DMs, etc.)
    for (const messagingEvent of entry.messaging) {
      handleMessagingEvent(messagingEvent);
    }
  }

  if (entry.changes) {
    // Handle changes events (profile updates, etc.)
    for (const change of entry.changes) {
      handleChangeEvent(change);
    }
  }

  if (entry.standby) {
    // Handle standby events (when page is not primary)
    for (const standbyEvent of entry.standby) {
      handleStandbyEvent(standbyEvent);
    }
  }
}

/**
 * Handle messaging events (comments, DMs, etc.)
 */
function handleMessagingEvent(event) {
  console.log('💬 Processing messaging event:', event);

  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const timestamp = event.timestamp;

  // Handle different types of messaging events
  if (event.message) {
    handleMessage(event.message, senderId, recipientId, timestamp);
  }

  if (event.postback) {
    handlePostback(event.postback, senderId, recipientId, timestamp);
  }

  if (event.reaction) {
    handleReaction(event.reaction, senderId, recipientId, timestamp);
  }

  // Store event for analytics (you can implement your own storage)
  storeEvent('messaging', event);
}

/**
 * Handle message events
 */
function handleMessage(message, senderId, recipientId, timestamp) {
  console.log('📨 Processing message:', {
    text: message.text,
    senderId,
    recipientId,
    timestamp
  });

  // Handle different message types
  if (message.text) {
    // Text message
    handleTextMessage(message.text, senderId, recipientId, timestamp);
  }

  if (message.attachments) {
    // Media message
    handleMediaMessage(message.attachments, senderId, recipientId, timestamp);
  }

  if (message.quick_reply) {
    // Quick reply
    handleQuickReply(message.quick_reply, senderId, recipientId, timestamp);
  }
}

/**
 * Handle text messages
 */
function handleTextMessage(text, senderId, recipientId, timestamp) {
  console.log('📝 Text message received:', text);

  // Example: Auto-reply to certain keywords
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('hello') || lowerText.includes('hi')) {
    console.log('🤖 Auto-replying to greeting');
    // You can implement auto-reply logic here
    // sendAutoReply(senderId, "Hello! Thanks for reaching out.");
  }

  if (lowerText.includes('help')) {
    console.log('🤖 Auto-replying to help request');
    // sendAutoReply(senderId, "How can I help you today?");
  }
}

/**
 * Handle media messages
 */
function handleMediaMessage(attachments, senderId, recipientId, timestamp) {
  console.log('🖼️ Media message received:', attachments.length, 'attachments');

  for (const attachment of attachments) {
    if (attachment.type === 'image') {
      console.log('📸 Image received:', attachment.payload?.url);
    } else if (attachment.type === 'video') {
      console.log('🎥 Video received:', attachment.payload?.url);
    } else if (attachment.type === 'audio') {
      console.log('🎵 Audio received:', attachment.payload?.url);
    } else if (attachment.type === 'file') {
      console.log('📄 File received:', attachment.payload?.url);
    }
  }
}

/**
 * Handle quick replies
 */
function handleQuickReply(quickReply, senderId, recipientId, timestamp) {
  console.log('⚡ Quick reply received:', {
    payload: quickReply.payload,
    text: quickReply.text,
    senderId,
    recipientId,
    timestamp
  });
}

/**
 * Handle postback events
 */
function handlePostback(postback, senderId, recipientId, timestamp) {
  console.log('🔘 Postback received:', {
    payload: postback.payload,
    title: postback.title,
    senderId,
    recipientId,
    timestamp
  });

  // Handle different postback payloads
  switch (postback.payload) {
    case 'GET_STARTED':
      console.log('🚀 User clicked Get Started');
      break;
    case 'HELP':
      console.log('❓ User clicked Help');
      break;
    default:
      console.log('🔘 Unknown postback payload:', postback.payload);
  }
}

/**
 * Handle reaction events
 */
function handleReaction(reaction, senderId, recipientId, timestamp) {
  console.log('😀 Reaction received:', {
    action: reaction.action,
    reaction: reaction.reaction,
    senderId,
    recipientId,
    timestamp
  });
}

/**
 * Handle change events
 */
function handleChangeEvent(change) {
  console.log('🔄 Change event received:', change);

  // Handle different types of changes
  if (change.field === 'feed') {
    console.log('📰 Feed change detected');
  } else if (change.field === 'conversations') {
    console.log('💬 Conversation change detected');
  } else if (change.field === 'messages') {
    console.log('📨 Message change detected');
  }
}

/**
 * Handle standby events
 */
function handleStandbyEvent(event) {
  console.log('⏸️ Standby event received:', event);
  // Handle events when page is not primary
}

/**
 * Store event for analytics
 */
function storeEvent(eventType, eventData) {
  // Implement your own storage logic here
  // This could be saving to a database, sending to analytics service, etc.
  console.log('💾 Event stored:', {
    type: eventType,
    timestamp: new Date().toISOString(),
    data: eventData
  });
}

/**
 * Send auto-reply message (example function)
 */
function sendAutoReply(recipientId, message) {
  // This is an example - you would implement actual message sending here
  console.log('🤖 Auto-reply would be sent:', {
    recipientId,
    message
  });
  
  // Example implementation using Facebook Messenger API:
  // const response = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     recipient: { id: recipientId },
  //     message: { text: message }
  //   })
  // });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
