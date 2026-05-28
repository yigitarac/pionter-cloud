export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-50">
      <div
        className={`rounded-lg px-4 py-3 shadow-lg text-sm font-semibold border ${
          toast.tip === "success"
            ? "bg-[#98971a] text-[#fbf1c7] border-[#79740e]"
            : toast.tip === "error"
              ? "bg-[#cc241d] text-[#fbf1c7] border-[#9d0006]"
              : "bg-[#458588] text-[#fbf1c7] border-[#076678]"
        }`}
      >
        {toast.mesaj}
      </div>
    </div>
  );
}
