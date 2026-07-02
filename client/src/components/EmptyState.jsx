import { SearchX } from "lucide-react";

const EmptyState = ({
  title = "Nothing found",
  message = "Try changing your search or filters.",
  action,
}) => (
  <div className="col-span-full flex min-h-[240px] items-center justify-center px-4 py-10">
    <div className="w-full max-w-md rounded-lg border border-[#ead7dc] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fdecef] text-[#7a1f3f]">
        <SearchX size={32} />
      </div>
      <h3 className="text-xl font-bold text-[#3A001F]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  </div>
);

export default EmptyState;
