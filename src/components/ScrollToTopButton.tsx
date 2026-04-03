"use client";

export default function ScrollToTopButton() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-gray-950 shadow-lg shadow-black/20 transition-all hover:bg-gray-100"
    >
      Get Started — It&apos;s Free
    </button>
  );
}
