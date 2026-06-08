export default function EditorLoadingState({
  karanlikMod = true,
  mesaj = "Preparing editor...",
  detay = "",
  height = "65vh",
}) {
  return (
    <div
      style={{ height }}
      className={`flex items-center justify-center ${
        karanlikMod ? "bg-[#1d2021]" : "bg-[#fbf1c7]"
      }`}
    >
      <div
        className={`mx-4 w-full max-w-sm rounded-2xl border px-5 py-4 shadow-lg ${
          karanlikMod
            ? "border-[#504945] bg-[#282828]"
            : "border-[#d5c4a1] bg-[#ebdbb2]"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <div
              className={`absolute inset-0 rounded-xl border-2 border-dashed ${
                karanlikMod ? "border-[#fabd2f]" : "border-[#b57614]"
              } animate-spin`}
            />

            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
                karanlikMod
                  ? "bg-[#fabd2f] text-[#282828]"
                  : "bg-[#b57614] text-[#fbf1c7]"
              }`}
            >
              P
            </div>
          </div>

          <div className="min-w-0">
            <p
              className={`text-sm font-black ${
                karanlikMod ? "text-[#ebdbb2]" : "text-[#3c3836]"
              }`}
            >
              {mesaj}
            </p>

            {detay && (
              <p
                className={`mt-1 text-xs font-bold ${
                  karanlikMod ? "text-[#a89984]" : "text-[#7c6f64]"
                }`}
              >
                {detay}
              </p>
            )}
          </div>
        </div>

        <div
          className={`mt-4 h-1.5 overflow-hidden rounded-full ${
            karanlikMod ? "bg-[#1d2021]" : "bg-[#fbf1c7]"
          }`}
        >
          <div
            className={`h-full w-1/2 rounded-full ${
              karanlikMod ? "bg-[#83a598]" : "bg-[#458588]"
            } animate-pulse`}
          />
        </div>
      </div>
    </div>
  );
}
