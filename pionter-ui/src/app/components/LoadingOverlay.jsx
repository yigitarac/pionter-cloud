export default function LoadingOverlay({ yukleniyor, mesaj }) {
  if (!yukleniyor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="rounded-xl border border-[#d5c4a1] dark:border-[#504945] bg-[#fbf1c7] dark:bg-[#282828] px-5 py-4 shadow-xl text-sm font-bold text-[#3c3836] dark:text-[#ebdbb2]">
        {mesaj}
      </div>
    </div>
  );
}
