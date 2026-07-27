import twilio from "twilio";
import { MessageLog } from "../models/MessageLog.js";
import { User } from "../models/User.js";

// Initialize Twilio client if credentials are present
let twilioClient = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

if (accountSid && authToken && accountSid.startsWith("AC")) {
  try {
    twilioClient = twilio(accountSid, authToken);
  } catch (err) {
    console.error("⚠️ Failed to initialize Twilio client:", err.message);
  }
}

/**
 * Checks if a message of a given type & entity has already been sent to a user today.
 * Prevents duplicate notification dispatches.
 */
export async function hasBeenSentToday({ user, relatedEntityId, type }) {
  const userId = typeof user === "object" ? user._id : user;
  const entityId = typeof relatedEntityId === "object" ? relatedEntityId?._id : relatedEntityId;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const query = {
    user: userId,
    type,
    sentAt: { $gte: todayStart },
  };

  if (entityId) {
    query.relatedEntityId = entityId;
  }

  const existing = await MessageLog.findOne(query);
  return !!existing;
}

/**
 * Central WhatsApp notification dispatch function.
 * Handles opt-in/verification checks, Twilio API sending, fallback logging, and MessageLog persistence.
 */
export async function sendWhatsAppMessage({
  user,
  recipient,
  message,
  type,
  relatedEntityId,
  relatedEntityType = "Other",
}) {
  let userDoc = user;
  if (typeof user === "string" || (user && !user.phoneNumber && !user._id)) {
    userDoc = await User.findById(user);
  }

  const userId = userDoc?._id || user;
  const phone = recipient || userDoc?.phoneNumber;

  if (!phone) {
    console.warn(`[WHATSAPP SKIPPED] No phone number available for user ${userId}`);
    return { success: false, reason: "no_phone_number" };
  }

  // Verify opt-in and verification status if user object available
  if (userDoc && typeof userDoc === "object") {
    if (!userDoc.whatsappOptIn) {
      console.log(`[WHATSAPP SKIPPED] User ${userId} (${userDoc.name}) has not opted into WhatsApp notifications.`);
      return { success: false, reason: "not_opted_in" };
    }
    if (!userDoc.whatsappVerified) {
      console.log(`[WHATSAPP SKIPPED] User ${userId} (${userDoc.name}) WhatsApp number is not verified.`);
      return { success: false, reason: "not_verified" };
    }
  }

  let status = "sent";
  let errorMsg = "";

  const formattedTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
  const formattedFrom = fromWhatsAppNumber
    ? fromWhatsAppNumber.startsWith("whatsapp:")
      ? fromWhatsAppNumber
      : `whatsapp:${fromWhatsAppNumber}`
    : "whatsapp:+14155238886";

  if (twilioClient && fromWhatsAppNumber) {
    try {
      await twilioClient.messages.create({
        from: formattedFrom,
        to: formattedTo,
        body: message,
      });
      console.log(`✅ [WHATSAPP SENT via Twilio] To: ${phone} | Type: ${type}`);
    } catch (err) {
      status = "failed";
      errorMsg = err.message || "Twilio delivery failed";
      console.error(`❌ [WHATSAPP FAILED via Twilio] To: ${phone} | Error:`, errorMsg);
    }
  } else {
    console.log(`\n💬 [WHATSAPP SIMULATION LOG] ----------------------------------`);
    console.log(`To:        ${phone}`);
    console.log(`Type:      ${type}`);
    console.log(`Entity:    ${relatedEntityType} (${relatedEntityId || "N/A"})`);
    console.log(`Message:   ${message}`);
    console.log(`---------------------------------------------------------------\n`);
  }

  let logRecord = null;
  try {
    logRecord = await MessageLog.create({
      user: userId,
      type,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType,
      recipient: phone,
      message,
      status,
      error: errorMsg,
      sentAt: new Date(),
    });
  } catch (logErr) {
    console.error("❌ Error creating MessageLog entry:", logErr.message);
  }

  return {
    success: status === "sent",
    status,
    log: logRecord,
  };
}
