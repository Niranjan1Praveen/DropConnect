"use client";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { AuroraText } from "@/components/magicui/aurora-text";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { AnimatedGradientTextDemo } from "@/components/ui/animatedGradientTextDemo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
export default function Hero() {
  const heroStrong = useMemo(
    () => ["Volunteering", "Community Impact", "Social Good"],
    []
  );

  const [currentText, setCurrentText] = useState(heroStrong[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        const currentIndex = heroStrong.indexOf(currentText);
        const nextIndex = (currentIndex + 1) % heroStrong.length;
        setCurrentText(heroStrong[nextIndex]);
        setFade(true);
      }, 500);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [currentText, heroStrong]);

  return (
    <section className="py-24 px-4 flex items-center justify-center overflow-x-clip">
      <div className="container relative">
        {/* <div className="flex justify-center">
          <AnimatedGradientTextDemo
            title={"Trusted by 100+ NGOs and corporates"}
          />
        </div> */}
        <div className="flex items-center justify-center">
          <div className="group relative mx-auto flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f] ">
            🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
            <AnimatedGradientText
              className="text-sm font-medium"
              speed={1}
              colorFrom="#4ade80"
              colorTo="#06b6d4"
            >
              Introducing DropConnect
            </AnimatedGradientText>
            <ChevronRight
              className="ml-1 size-4 stroke-neutral-500 transition-transform
 duration-300 ease-in-out group-hover:translate-x-0.5"
            />
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-medium text-center mt-6 max-w-6xl mx-auto leading-[1.15]">
          Drive Real-World Impact Through Purposeful{" "}
          <strong
            className={`transition font-medium fade-up ${
              fade ? "fade-in" : "fade-out"
            }`}
          >
            <AuroraText colors={["#4ade80", "#30f6d5", "#5EF7BA", "#06b6d4"]}>
              {currentText}{" "}
            </AuroraText>
          </strong>
        </h1>

        <p className="text-center text-xl text-white/50 mt-8 max-w-6xl mx-auto leading-relaxed">
          Our platform empowers students, NGOs, and corporates to collaborate on
          water resilience projects—combining verified volunteerism, CSR
          compliance, and community action in one unified ecosystem.
        </p>

        <div className="flex mt-8 md:max-w-lg mx-auto items-center justify-center gap-5">
          <RainbowButton
            variant={"outline"}
            className="rounded-full text-black p-5"
          >
            Read Docs
          </RainbowButton>
          <RainbowButton className="text-white rounded-full p-5">
            <a href="#pricing">Get Started Now</a>
          </RainbowButton>
        </div>
      </div>
    </section>
  );
}
