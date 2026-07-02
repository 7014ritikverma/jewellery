import React from "react";

const Contact = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6 md:px-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
          Contact Us
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">Get In Touch</h2>

            <div className="space-y-4 text-gray-600">
              <p>📍 Ajmer, Rajasthan, India</p>
              <p>📞 +91 9876543210</p>
              <p>📧 support@jewellery.com</p>
              <p>🕒 Mon - Sat : 10AM - 8PM</p>
            </div>
          </div>

          <form className="bg-white p-8 rounded-2xl shadow-lg space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full border p-3 rounded-lg"
            />

            <input
              type="text"
              placeholder="Phone"
              className="w-full border p-3 rounded-lg"
            />

            <textarea
              rows="5"
              placeholder="Message"
              className="w-full border p-3 rounded-lg"
            ></textarea>

            <button className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;