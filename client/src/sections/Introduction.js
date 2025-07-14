"use client";
import Tags from "@/components/ui/tags";
import { useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
const text = `Despite growing CSR funding and a motivated youth population, real-world volunteer impact remains fragmented, impulsively untracked, and severely undervalued.`;
const words = text.split(" ");
export default function Introduction() {
  const scrollTarget = useRef();
  const { scrollYProgress } = useScroll({
    target: scrollTarget,
    offset: ["start end", "end end"],
  });
  const [currentWord, setCurrentWord] = useState(0);
  const wordIndex = useTransform(scrollYProgress, [0, 1], [0, words.length]);
  useEffect(() => {
    wordIndex.on("change", (latest) => {
      setCurrentWord(latest);
    });
  }, [wordIndex]);
  return (
    <section className="relative py-28 px-4 lg:py-30 flex items-center justify-center">
      <div className="container">
        <div className="sticky top-20 md:top-28 lg:top-40">
          <div className="flex justify-center">
            <Tags title={"Introduction"} />
          </div>
          <div className="text-4xl md:text-5xl text-center font-medium mt-10">
            <span>Social impact should be measurable and meaningful.</span>{" "}
            <span className="text-white/15 leading-tight">
              {words.map((word, index) => {
                const isVisible = index < currentWord;
                const shouldHightlight =
                  (isVisible &&
                    (word.toLowerCase().includes("fragmented") ||
                      word.toLowerCase().includes("untracked"))) ||
                  word.toLowerCase().includes("undervalued");

                return (
                  <span
                    key={index}
                    className={twMerge(
                      "transition duration-500",
                      isVisible ? "text-white" : "text-white/15",
                      isVisible &&
                        shouldHightlight &&
                        "text-red-500 italic transition",
                    )}
                  >
                    {word + " "}
                  </span>
                );
              })}
            </span>
            <span className="text-primary-400 block mt-3">
              That’s why we built DropConnect.
            </span>
          </div>
        </div>
        <div className="h-[150vh]" ref={scrollTarget}></div>
      </div>
    </section>
  );
}
