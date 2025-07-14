"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from "@/assets/images/logo.png";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs";
import { AuroraText } from "@/components/magicui/aurora-text";
const navLinks = [
  { label: "Home", href: "" },
  { label: "Features", href: "#features" },
  { label: "FAQs", href: "#faqs" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <section className="py-4 px-4 lg:py-8 flex items-center justify-center fixed w-full top-0 z-100">
        <div className="container max-w-5xl">
          <div className="rounded-[27px] md:rounded-full bg-neutral-950/70 backdrop-blur">
            <div className="grid grid-cols-2 lg:grid-cols-3 p-2 items-center px-4 md:pr-2">
              <div className="flex items-center">
                <Image src={logo} alt="Logo Icon" className="h-10 w-12" />
                <p className="text-2xl font-bold text-white/20 md:inline-flex hidden">
                  <AuroraText
                    colors={["#4ade80", "#30f6d5", "#5EF7BA", "#06b6d4"]}
                  >
                    DropConnect
                  </AuroraText>
                </p>
              </div>
              <div className="lg:flex justify-center items-center hidden">
                <nav className="flex gap-6 font-medium">
                  {navLinks.map((link) => (
                    <a href={link.href} key={link.label}>
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="flex justify-end gap-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="feather feather-menu md:hidden"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <line
                    x1="3"
                    y1="6"
                    x2="21"
                    y2="6"
                    className={twMerge(
                      "origin-left transition",
                      isOpen && "rotate-45 -translate-y-1"
                    )}
                  ></line>
                  <line
                    x1="3"
                    y1="12"
                    x2="21"
                    y2="12"
                    className={twMerge("transition", isOpen && "opacity-0")}
                  ></line>
                  <line
                    x1="3"
                    y1="18"
                    x2="21"
                    y2="18"
                    className={twMerge(
                      "origin-left transition",
                      isOpen && "-rotate-45 translate-y-1"
                    )}
                  ></line>
                </svg>
                <LoginLink>
                  <Button
                    variant={"login"}
                    className="cursor-pointer hidden md:inline-flex items-center"
                  >
                    Log in
                  </Button>
                </LoginLink>
                <Button
                  variant={"signup"}
                  className="cursor-pointer hidden md:inline-flex items-center"
                >
                  <a href="#signUpOptions">Register</a>
                </Button>
              </div>
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-4 py-4 ">
                    {navLinks.map((link) => (
                      <a href={link.href} key={link.label} className="">
                        {link.label}
                      </a>
                    ))}
                    <LoginLink>
                      <Button
                        variant={"login"}
                        className="cursor-pointer md:inline-flex items-center"
                      >
                        Log in
                      </Button>
                    </LoginLink>
                    <Button
                      variant={"signup"}
                      className="cursor-pointer md:inline-flex items-center"
                    >
                      <a href="#signUpOptions">Register</a>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
      <div className="pb-[86px] md:pb-[98px] lg:pb-[130px]"></div>
    </>
  );
}