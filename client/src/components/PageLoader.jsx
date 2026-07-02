import { Gem } from "lucide-react";

const PageLoader = ({ label = "Loading..." }) => (
  <div className="flex min-h-[260px] items-center justify-center px-4 py-12">
    <div className="text-center text-[#3A001F]">
      <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecef]">
        <Gem className="animate-pulse text-[#7a1f3f]" size={30} />
        <span className="absolute inset-0 rounded-full border-2 border-[#7a1f3f]/20 border-t-[#7a1f3f] animate-spin" />
      </div>
      <p className="font-semibold">{label}</p>
    </div>
  </div>
);

export default PageLoader;
