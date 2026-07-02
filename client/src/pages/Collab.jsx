const Collab = () => {
  return (
    <div className="min-h-screen py-20 px-6 max-w-4xl mx-auto mt-20">
      <h1 className="text-4xl font-bold mb-8 text-center">Collab With Us</h1>

      <form className="space-y-4">
        <input className="w-full border p-3 rounded" placeholder="Name" />
        <input className="w-full border p-3 rounded" placeholder="Instagram / Website" />
        <textarea className="w-full border p-3 rounded" rows="5" placeholder="Collaboration Idea" />
        <button className="bg-black text-white px-6 py-3 rounded">
          Apply
        </button>
      </form>
    </div>
  );
};

export default Collab;