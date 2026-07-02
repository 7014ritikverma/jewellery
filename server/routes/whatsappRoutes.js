import express from "express";
import jwt from "jsonwebtoken";
import { adminAuth } from "../middleware/auth.js";
import { getWebsiteBotReply, getWhatsAppBotReply, sendWhatsAppText } from "../utils/whatsappService.js";

const router = express.Router();

const getUserIdFromRequest = (req) => {
  try {
    const header = req.header("Authorization");
    const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : header;

    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === "user" ? decoded.id : null;
  } catch {
    return null;
  }
};

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const entries = req.body?.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const messages = change.value?.messages || [];

        for (const message of messages) {
          if (message.type !== "text") continue;

          const from = message.from;
          const text = message.text?.body || "";
          const reply = await getWhatsAppBotReply({ from, text });

          await sendWhatsAppText({ to: from, body: reply });
        }
      }
    }
  } catch (err) {
    console.log("WhatsApp webhook handling failed:", err.message);
  }
});

router.post("/chatbot", async (req, res) => {
  try {
    const reply = await getWebsiteBotReply({
      userId: getUserIdFromRequest(req),
      text: req.body?.message,
    });

    res.json({ reply });
  } catch (err) {
    console.log("Website chatbot failed:", err.message);
    res.status(500).json("Chatbot failed");
  }
});

router.post("/send-test", adminAuth, async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json("To and message are required");
    }

    await sendWhatsAppText({ to, body: message });
    res.json("WhatsApp message sent");
  } catch (err) {
    res.status(500).json(err.response?.data || err.message || "WhatsApp send failed");
  }
});

export default router;
