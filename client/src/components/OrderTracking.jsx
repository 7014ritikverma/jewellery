const statusSteps = ["Pending", "Processing", "Shipped", "Delivered"];

const getStepIndex = (status = "") => {
  const index = statusSteps.indexOf(status);
  return index >= 0 ? index : 0;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const OrderTracking = ({ order, compact = false }) => {
  const activeIndex = getStepIndex(order?.status);
  const events = order?.shiprocket?.trackingEvents || [];

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <div className="grid grid-cols-4 gap-2">
        {statusSteps.map((step, index) => {
          const isDone = index <= activeIndex;

          return (
            <div key={step} className="min-w-0">
              <div className={`h-2 rounded-full ${isDone ? "bg-[#6b0f1a]" : "bg-gray-200"}`} />
              <p className={`mt-2 text-xs font-semibold ${isDone ? "text-[#6b0f1a]" : "text-gray-400"}`}>
                {step}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded border p-3 text-sm text-gray-700">
        <p><b>Current status:</b> {order?.status || "-"}</p>
        {order?.shiprocket?.awbCode && <p><b>AWB:</b> {order.shiprocket.awbCode}</p>}
        {order?.shiprocket?.courierName && <p><b>Courier:</b> {order.shiprocket.courierName}</p>}
        {order?.shiprocket?.status && <p><b>Courier status:</b> {order.shiprocket.status}</p>}
        {order?.shiprocket?.lastTrackedAt && (
          <p><b>Last synced:</b> {formatDate(order.shiprocket.lastTrackedAt)}</p>
        )}
      </div>

      {!compact && events.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold">Tracking History</p>
          {events.map((event, index) => (
            <div key={`${event.date}-${index}`} className="border-l-2 border-[#6b0f1a] pl-3">
              <p className="font-semibold">{event.status || event.activity || "Tracking update"}</p>
              {event.activity && <p className="text-sm text-gray-600">{event.activity}</p>}
              <p className="text-xs text-gray-500">
                {[event.location, formatDate(event.date)].filter(Boolean).join(" | ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
