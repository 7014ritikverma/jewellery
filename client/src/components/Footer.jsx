import {
    FaFacebookF,
    FaInstagram,
    FaYoutube,
    FaPinterestP,
    FaSnapchatGhost,
} from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="bg-[#f7f7f7] text-[#6b0f1a] px-10 py-14 mt-16">

            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16">

                {/* QUICK LINKS */}
                <div>
                    <h2 className="font-bold text-2xl mb-6 underline">
                        Quick Links
                    </h2>

                    <ul className="space-y-3 text-lg">

                        <li className="hover:underline cursor-pointer">
                            Orders
                        </li>

                        <li className="hover:underline cursor-pointer">
                            Contact Us
                        </li>

                        <li className="hover:underline cursor-pointer">
                            Bulk Inquiry
                        </li>

                        <li className="hover:underline cursor-pointer">
                            Shop By Category
                        </li>

                        <li className="hover:underline cursor-pointer">
                            Profile
                        </li>

                    </ul>
                </div>

                {/* INFO */}
                <div>
                    <h2 className="font-bold text-2xl mb-6 underline">
                        Info
                    </h2>

                    <ul className="space-y-3 text-lg">

                        <li>FAQ</li>
                        <li>Blogs</li>
                        <li>About Us</li>
                        <li>Brand Story</li>
                        <li>Job's</li>
                        <li>Privacy policy</li>
                        <li>Collab With Us</li>
                        <li>Customer Reviews</li>
                        <li>Return and Refund</li>
                        <li>Terms of Condition</li>

                    </ul>
                </div>

                {/* CONTACT */}
                <div>
                    <h2 className="font-bold text-2xl mb-6 underline">
                        Get In Touch
                    </h2>

                    <div className="space-y-5 text-lg leading-8">

                        <p>
                            Khushbu Jewellers,
                            <br />
                            Khushbu Jewellers, Sandhu Palace 2 floor,
                            168, Opp, Circuit House Rd,
                            Ajit Colony, Jodhpur,
                            Rajasthan 342001
                        </p>

                        <p className="underline cursor-pointer">
                            info@khushbujewellers.com
                        </p>

                        <p>
                            GST No. 08MQCPS9310R1ZS
                        </p>

                        <p>
                            (Trade Name: KHUSHBU JEWELLERS,
                            Legal Name: PIYUSH SONI)
                        </p>

                        <p className="underline">
                            +91 91160 10685
                            <span className="text-sm">
                                (10 AM to 6 PM)
                            </span>
                        </p>

                    </div>
                </div>

            </div>

            {/* SOCIAL ICONS */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-2xl">

                <div className="border border-[#6b0f1a] p-3 rounded-lg hover:bg-[#6b0f1a] hover:text-white transition cursor-pointer">
                    <FaFacebookF />
                </div>

                <div className="border border-[#6b0f1a] p-3 rounded-lg hover:bg-[#6b0f1a] hover:text-white transition cursor-pointer">
                    <FaInstagram />
                </div>

                <div className="border border-[#6b0f1a] p-3 rounded-lg hover:bg-[#6b0f1a] hover:text-white transition cursor-pointer">
                    <FaYoutube />
                </div>

                <div className="border border-[#6b0f1a] p-3 rounded-lg hover:bg-[#6b0f1a] hover:text-white transition cursor-pointer">
                    <FaPinterestP />
                </div>

                <div className="border border-[#6b0f1a] p-3 rounded-lg hover:bg-[#6b0f1a] hover:text-white transition cursor-pointer">
                    <FaSnapchatGhost />
                </div>

            </div>

        </footer>
    );
};

export default Footer;