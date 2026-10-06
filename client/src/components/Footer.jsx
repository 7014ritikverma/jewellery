import {
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaSnapchatGhost,
  FaYoutube,
} from "react-icons/fa";
import { FiClock, FiMail, FiMapPin, FiPhone, FiSend } from "react-icons/fi";
import { Link } from "react-router-dom";

const Footer = () => {
  const quickLinks = [
    ["Home", "/"],
    ["Shop", "/shop"],
    ["New Arrivals", "/shop?type=new"],
    ["Best Sellers", "/shop?type=bestseller"],
    ["Bulk Inquiry", "/bulk-inquiry"],
    ["Contact Us", "/contact"],
  ];

  const infoLinks = [
    ["About Us", "/about"],
    ["FAQs", "/faq"],
    ["Shipping Policy", "/return-refund"],
    ["Return Policy", "/return-refund"],
    ["Privacy Policy", "/privacy"],
    ["Terms & Conditions", "/terms-conditions"],
    ["Track Order", "/orders"],
    ["Store Locator", "/contact"],
  ];

  return (
    <footer className="mt-8 bg-[#3A001F] text-white bodoni-moda">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1.25fr_1fr]">
        <div>
          <Link to="/" className="inline-block">
            <img src="Logo2.png" alt="Shree Sarraf" className="h-14 w-auto" />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/72">
            Timeless jewellery crafted with love and perfection since years.
          </p>
          <div className="mt-6 flex gap-3">
            {[FaInstagram, FaFacebookF, FaYoutube, FaPinterestP, FaSnapchatGhost].map((Icon, index) => (
              <span
                key={index}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/24 text-sm text-white/80 transition hover:border-white hover:bg-white hover:text-[#5c0b2a]"
              >
                <Icon />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-5 text-sm font-bold">Quick Links</h2>
          <ul className="grid gap-2 text-sm text-white/72">
            {quickLinks.map(([label, path]) => (
              <li key={label}>
                <Link to={path} className="transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-5 text-sm font-bold">Info</h2>
          <ul className="grid gap-2 text-sm text-white/72">
            {infoLinks.map(([label, path]) => (
              <li key={label}>
                <Link to={path} className="transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-5 text-sm font-bold">Get In Touch</h2>
          <div className="grid gap-4 text-sm leading-6 text-white/76">
            <p className="flex gap-3">
              <FiMapPin className="mt-1 shrink-0" />
              Shree Sarraf, Sandhu Palace 2 floor, 168, Opp Circuit House Rd,
              Ajit Colony, Jodhpur, Rajasthan 342001
            </p>
            <p className="flex items-center gap-3">
              <FiPhone /> +91 91160 10685
            </p>
            <p className="flex items-center gap-3">
              <FiMail /> info@shreesarraf.com
            </p>
            <p className="flex items-start gap-3">
              <FiClock className="mt-1" /> Mon - Sat: 10:00 AM - 7:00 PM
              <br />
              Sunday: Closed
            </p>
          </div>
        </div>

        <div>
          <h2 className="mb-5 text-sm font-bold">Newsletter</h2>
          <p className="text-sm text-white/72">Subscribe for exclusive offers</p>
          <form className="mt-5 flex overflow-hidden rounded-md border border-white/24">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-white/46"
            />
            <button
              type="submit"
              aria-label="Subscribe"
              className="flex w-12 items-center justify-center bg-white/10 transition hover:bg-white hover:text-[#5c0b2a]"
            >
              <FiSend />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/12">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-6 py-5 text-xs text-white/72 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2024 Shree Sarraf. All Rights Reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span>We Accept</span>
            {["VISA", "MC", "RuPay", "UPI", "Paytm"].map((item) => (
              <span
                key={item}
                className="rounded bg-white px-2 py-1 text-[10px] font-extrabold text-[#5c0b2a]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
