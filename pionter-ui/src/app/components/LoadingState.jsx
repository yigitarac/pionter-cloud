export default function LoadingState({
  yukleniyor,
  mesaj,
  progress = null,
  progressLabel = "Upload",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <svg
        className="animate-spin h-8 w-8 text-[#458588] dark:text-[#83a598] mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>

      <p className="text-sm text-[#7c6f64] dark:text-[#a89984] animate-pulse">
        {mesaj}
      </p>
      {typeof progress === "number" && (
        <div className="mt-4 w-full max-w-xs">
          <div className="mb-1 flex justify-between text-xs font-bold text-[#7c6f64] dark:text-[#a89984]">
            <span>{progressLabel}</span>
            <span>{progress}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-[#d5c4a1] dark:bg-[#504945]">
            <div
              className="h-full rounded-full bg-[#458588] dark:bg-[#83a598] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
