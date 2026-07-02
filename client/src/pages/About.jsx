import React from "react";

const About = () => {
    return (
        <div className="bg-white min-h-screen py-16 px-6 md:px-20">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
                    About Us
                </h1>

                <p className="text-gray-600 text-lg text-center max-w-3xl mx-auto mb-12">
                    At <span className="font-semibold">Your Brand Name</span>, we believe
                    jewellery is more than an accessory — it reflects elegance, beauty,
                    and timeless memories.
                </p>

                <div className="grid md:grid-cols-2 gap-10 items-center">
                    <img
                        src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338"
                        alt="Jewellery"
                        className="rounded-2xl shadow-lg w-full h-[400px] object-cover"
                    />

                    <div>
                        <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
                        <p className="text-gray-600 mb-4">
                            Founded with a passion for premium craftsmanship, we create
                            jewellery that blends traditional artistry with modern design.
                        </p>

                        <p className="text-gray-600 mb-4">
                            Every piece is crafted carefully to ensure unmatched quality,
                            beauty, and elegance.
                        </p>

                        <ul className="space-y-3">
                            <li>✨ Premium Quality Materials</li>
                            <li>✨ Elegant Designs</li>
                            <li>✨ Trusted Craftsmanship</li>
                            <li>✨ Customer Satisfaction</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;