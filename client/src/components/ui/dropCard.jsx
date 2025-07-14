"use client";
import React from "react";
import { Button } from "./button";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Card } from "./card";

const DropCard = ({ item }) => {
  const getRegisterConfig = () => {
    switch(item.title) {
      case "Volunteer":
        return {
          url: "/api/auth/creation?user_type=volunteer",
          text: "Register as Volunteer"
        };
      case "NGO / Organization":
        return {
          url: "/api/auth/creation?user_type=organization",
          text: "Register as Organization"
        };
      case "Corporates":
        return {
          url: "/api/auth/creation?user_type=corporate",
          text: "Register as Corporate"
        };
      default:
        return {
          url: "/api/auth/creation",
          text: "Register Now"
        };
    }
  };

  const { url, text } = getRegisterConfig();

  return (
    <Card className={"bg-transparent border-0"}>
      <div className="flex flex-col space-y-4 text-white p-4">
        <h2 className="text-primary-400 text-3xl font-bold">{item.cta}/<span className="text-xl text-white">{item.catchPhrase}</span></h2>
        <img
          src={item?.img ?? ""}
          className="w-full h-[300px] rounded-md"
          alt="Image"
          height={300}
          width={800}
        />
        <p className="font-medium text-xl px-2 leading-normal">
          {item.description}
        </p>
        <RegisterLink postLoginRedirectURL={url}>
          <Button className="cursor-pointer w-full" variant={"outline"}>
            {text}
          </Button>
        </RegisterLink>
        <ul className="text-md text-white/80 mt-4 space-y-2">
          {item.features?.map((point, i) => (
            <li key={i} className="flex gap-2 text-[1.1rem]">
              <span className="text-primary-400">✓</span> {point}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default DropCard;