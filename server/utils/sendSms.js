import axios from "axios";

const formatIndianMobile = (mobile) => {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const formatMsg91Mobile = (mobile) => {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
};

const sendMsg91 = async ({ mobile, message }) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE || "4";
  const country = process.env.MSG91_COUNTRY || "91";

  if (!authKey || !senderId) {
    throw new Error("MSG91 credentials are not configured");
  }

  try {
    await axios.post(
      "https://api.msg91.com/api/v2/sendsms",
      {
        sender: senderId,
        route,
        country,
        sms: [
          {
            message,
            to: [formatMsg91Mobile(mobile)],
          },
        ],
      },
      {
        headers: {
          authkey: authKey,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
  } catch (err) {
    console.log("MSG91 SMS failed:", err.response?.data || err.message);
    throw err;
  }
};

const sendTwilio = async ({ mobile, message }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio credentials are not configured");
  }

  const to = String(mobile).startsWith("+") ? mobile : `+${formatIndianMobile(mobile)}`;
  const fromValue = String(from).startsWith("+") ? from : `+${formatIndianMobile(from)}`;
  const body = new URLSearchParams({ To: to, From: fromValue, Body: message });

  try {
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      body,
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        timeout: 10000,
      }
    );
  } catch (err) {
    console.log("Twilio SMS failed:", err.response?.data || err.message);
    throw err;
  }
};

const providerIsConfigured = (provider) => {
  if (provider === "msg91") {
    return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID);
  }

  if (provider === "twilio") {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
  }

  return false;
};

const getProviderOrder = () => {
  const configured = (process.env.SMS_PROVIDER || "auto")
    .toLowerCase()
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean);

  const requested = configured.includes("auto") ? ["msg91", "twilio"] : configured;
  return requested.filter((provider) => ["msg91", "twilio"].includes(provider) && providerIsConfigured(provider));
};

export const sendOtpSms = async ({ mobile, otp }) => {
  const brand = process.env.OTP_BRAND_NAME || "Jewellery Store";
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES) || 30;
  const message = `${otp} is your ${brand} login OTP. It is valid for ${expiryMinutes} minutes. Do not share it.`;
  const providers = getProviderOrder();

  for (const provider of providers) {
    try {
      if (provider === "msg91") {
        await sendMsg91({ mobile, message });
      }

      if (provider === "twilio") {
        await sendTwilio({ mobile, message });
      }

      console.log(`OTP SMS sent using ${provider}`);
      return provider;
    } catch (err) {
      console.log(`${provider.toUpperCase()} OTP provider failed, trying next provider if available`);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`DEV OTP fallback for ${mobile}: ${otp}`);
    return "dev";
  }

  throw new Error("No working SMS provider is configured");
};
