import { AlertTriangle, X } from "lucide-react";

const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 text-[#3A001F] shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-[#fdecef] text-[#7a1f3f]"}`}>
            <AlertTriangle size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold">{title}</h3>
            {message && <p className="mt-1 text-sm leading-6 text-gray-600">{message}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Close confirmation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#3A001F] hover:bg-[#5A0A2C]"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
