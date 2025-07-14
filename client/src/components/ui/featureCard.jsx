"use client";
import React from "react";
import { twMerge } from "tailwind-merge";
import { ShineBorder } from "@/components/magicui/shine-border";
function FeatureCard({ title, description, children, className }) {
  return (
    <div
      className={twMerge(
        " p-6 rounded-3xl relative overflow-hidden",
        className
      )}
    >
      <div className="aspect-video">{children}</div>
      <div>
        <h3 className="text-2xl font-medium mt-6">{title}</h3>
        <p className="text-white/50 mt-2">{description}</p>
      </div>
    </div>
  );
}

export default FeatureCard;
