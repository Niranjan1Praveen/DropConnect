"use client"
import { faqs } from "../assets/data/faqs"
import Tags from "@/components/ui/tags";

import React from "react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function Faqs() {
  return (
    <section className="text-white py-16 px-4 md:px-12" id="faqs">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-6">
                  <Tags title={"FAQs"}/>
          </div>
        
        <h2 className="text-4xl font-bold">
          Questions? We&rsquo;ve got{" "}
          <span className="text-primary-400">answers</span>
        </h2>
      </div>
      <div className="mt-10 max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-5">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="rounded-xl bg-[#1a1a1a] px-6"
            >
              <AccordionTrigger className="text-white py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-neutral-400">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
