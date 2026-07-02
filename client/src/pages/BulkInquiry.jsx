const BulkInquiry = () => {
  return (
    <div className="min-h-screen py-20 px-6 max-w-4xl mx-auto mt-20">
      <h1 className="text-4xl font-bold mb-8 text-center">Bulk Inquiry</h1>

      <form className="space-y-4">
        <input className="w-full border p-3 rounded" placeholder="Name" />
        <input className="w-full border p-3 rounded" placeholder="Company Name" />
        <input className="w-full border p-3 rounded" placeholder="Phone" />
        <textarea className="w-full border p-3 rounded" rows="5" placeholder="Requirement" />
        <button className="bg-black text-white px-6 py-3 rounded">
          Submit
        </button>
      </form>
    </div>
  );
};

export default BulkInquiry;