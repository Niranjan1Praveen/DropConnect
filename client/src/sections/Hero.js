import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import design1 from "@/assets/images/design-example-1.png";
import design2 from "@/assets/images/design-example-2.png";

import Image from "next/image";
export default function Hero() {
  return (
    <section className="py-24 px-4 flex items-center justify-center overflow-x-clip">
      <div className="container relative">
        <div className="absolute -left-32 top-16 hidden lg:block z-[-10]">
          <Image src={design1} alt="hero-design-1-example" />
        </div>
        <div className="absolute -right-64 -top-16 hidden lg:block z-[-10]">
          <Image src={design2} alt="hero-design-2-example" />
        </div>
        <div className="flex justify-center">
          <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold">
            $7.5m raised in one year
          </div>
        </div>

        <h1 className="text-6xl md:text-6xl font-medium text-center mt-6 max-w-6xl mx-auto leading-[1.15]">
          Drive Real-World Impact Through Purposeful Volunteering
        </h1>
        <p className="text-center text-xl text-white/50 mt-8 max-w-6xl mx-auto">
          Our platform empowers students, NGOs, and corporates to collaborate on
          water resilience projects—combining verified volunteerism, CSR
          compliance, and community action in one unified ecosystem.
        </p>

        <form className="flex border border-white/15 rounded-full p-2 mt-8 md:max-w-lg mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            className="border-none px-4 md:flex-1 w-full"
          />
          <Button
            type="submit"
            variant="signup"
            size="sm"
            className="whitespace-nowrap"
          >
            Sign Up
          </Button>
        </form>
      </div>
    </section>
  );
}
