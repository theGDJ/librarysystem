"use client";

import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const variants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Reveal({
  children,
  i = 0,
  className,
}: {
  children: ReactNode;
  i?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      custom={i}
    >
      {children}
    </motion.div>
  );
}

export function AskBar({ big = false }: { big?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/assistant?q=${encodeURIComponent(q.trim())}` : "/assistant");
      }}
      className={`group flex w-full items-center gap-2 rounded-full border border-line bg-ink-850/90 pl-3 pr-2 backdrop-blur transition-colors focus-within:border-gold-500/60 ${
        big ? "py-2.5" : "py-1.5"
      }`}
    >
      <Sparkles className="size-4 shrink-0 text-gold-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ask anything about Indian Standards — e.g. “Which IS applies to LED bulbs?”"
        className="w-full bg-transparent text-sm text-white placeholder:text-ash-500"
      />
      <button type="submit" className="btn-gold shrink-0 px-4 py-2 text-[13px]">
        Ask <ArrowRight className="size-3.5" />
      </button>
    </form>
  );
}
