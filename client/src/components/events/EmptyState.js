import Link from "next/link";
import { FileIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Friendly placeholder when a list is empty; pass `createHref` to show a Create button
export default function EmptyState({ title, text, createHref, icon: Icon = FileIcon }) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed p-8 text-center animate-in fade-in-50 rounded-md">
      <div className="bg-primary/15 flex items-center justify-center rounded-full size-20 border-4 border-indigo-600">
        <Icon className="size-10 text-indigo-600" />
      </div>
      <h2 className="mt-6 font-semibold text-2xl">{title}</h2>
      <p className="mb-8 mt-2 text-center text-xl text-muted-foreground max-w-lg">{text}</p>
      {createHref && (
        <Button variant="secondary" size="lg" className="bg-indigo-600 text-white" asChild>
          <Link href={createHref}><PlusIcon /> Create</Link>
        </Button>
      )}
    </div>
  );
}

export const DemoNotice = () => (
  <small className="text-muted-foreground">
    All organizations, events, and NGOs listed are for prototype and demonstration purposes only.
  </small>
);
