export default function FloatingBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="hero-grid absolute inset-0 opacity-60" />
      <div className="hero-blob hero-blob-1 absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-violet-400/35 blur-3xl" />
      <div className="hero-blob hero-blob-2 absolute -right-20 top-1/4 h-[22rem] w-[22rem] rounded-full bg-indigo-400/30 blur-3xl" />
      <div className="hero-blob hero-blob-3 absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="hero-blob hero-blob-4 absolute top-1/2 right-1/4 h-48 w-48 rounded-full border border-white/40 bg-white/20 shadow-lg backdrop-blur-sm" />
      <div className="hero-blob hero-blob-5 absolute bottom-32 right-[12%] h-32 w-32 rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-white/50 to-indigo-100/30 shadow-md backdrop-blur-md" />
      <div className="hero-blob hero-blob-6 absolute left-[8%] top-[42%] h-20 w-20 rounded-full bg-indigo-500/15 ring-1 ring-indigo-400/20" />
    </div>
  );
}
