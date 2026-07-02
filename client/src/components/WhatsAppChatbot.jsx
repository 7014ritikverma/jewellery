import { useMemo, useState } from "react";
import axios from "axios";
import { MessageCircle, Send, X } from "lucide-react";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "917014099431";

const quickMessages = [
  { label: "Track order", text: "orders" },
  { label: "Support", text: "support" },
  { label: "Menu", text: "menu" },
];

const initialMessages = [
  {
    from: "bot",
    text: "Hi, welcome. Send menu, orders, or support.",
  },
];

const WhatsAppChatbot = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);

  const cleanNumber = useMemo(() => String(WHATSAPP_NUMBER).replace(/\D/g, ""), []);

  const sendToBot = async (text = message) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { from: "user", text: trimmed }]);
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.post(
        `/api/whatsapp/chatbot`,
        { message: trimmed },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      setMessages((current) => [...current, { from: "bot", text: res.data.reply }]);
    } catch (err) {
      console.log(err);
      setMessages((current) => [...current, { from: "bot", text: "Sorry, chatbot reply failed. Please try WhatsApp support." }]);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent("Hi")}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {open && (
        <div className="mb-3 w-[min(92vw,360px)] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
          <div className="flex items-center justify-between bg-[#075e54] px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Chat Support</p>
              <p className="text-xs text-white/80">Instant replies for orders and support</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 hover:bg-white/10"
              title="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto bg-[#efe7dd] p-4">
            {messages.map((item, index) => (
              <div
                key={`${item.from}-${index}`}
                className={`whitespace-pre-line rounded-xl px-3 py-2 text-sm shadow-sm ${
                  item.from === "user"
                    ? "ml-auto max-w-[82%] bg-[#dcf8c6] text-gray-900"
                    : "mr-auto max-w-[88%] bg-white text-gray-800"
                }`}
              >
                {item.text}
              </div>
            ))}
            {loading && (
              <div className="mr-auto rounded-xl bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                Typing...
              </div>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div className="flex flex-wrap gap-2">
              {quickMessages.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => sendToBot(item.text)}
                  className="rounded-full border border-[#075e54]/20 px-3 py-1.5 text-sm font-semibold text-[#075e54] hover:bg-[#e7f6ef]"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendToBot();
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#25d366]/40"
                placeholder="Type message"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#25d366] text-white disabled:opacity-60"
                title="Send"
              >
                <Send size={18} />
              </button>
            </form>

            <button
              type="button"
              onClick={openWhatsApp}
              className="w-full rounded-lg border border-[#25d366] py-2 text-sm font-semibold text-[#075e54]"
            >
              Open WhatsApp
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-2xl transition hover:scale-105"
        title="Open chat"
      >
        <MessageCircle size={28} />
      </button>
    </div>
  );
};

export default WhatsAppChatbot;
