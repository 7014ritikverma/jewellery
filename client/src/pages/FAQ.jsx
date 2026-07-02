const FAQ = () => {
    const faqs = [
        {
            q: "How long does delivery take?",
            a: "Orders are delivered within 3-7 business days."
        },
        {
            q: "Do you offer returns?",
            a: "Yes, return policy applies as per terms."
        },
        {
            q: "Are payments secure?",
            a: "Yes, all payments are 100% secure."
        }
    ];

    return (
        <div className="min-h-screen py-20 px-6 max-w-5xl mx-auto mt-20">
            <h1 className="text-4xl font-bold text-center mb-8">FAQ</h1>

            <div className="space-y-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="shadow rounded p-5">
                        <h2 className="font-semibold text-lg">{faq.q}</h2>
                        <p className="text-gray-600 mt-2">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;