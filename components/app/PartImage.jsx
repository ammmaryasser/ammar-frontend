import { Package } from "lucide-react";

// Placeholder until real photos arrive with the backend.
export default function PartImage({ className = "w-10 h-10", iconSize = 16 }) {
  return (
    <div
      className={`flex items-center justify-center bg-bg border border-line rounded-md text-muted shrink-0 ${className}`}
    >
      <Package size={iconSize} strokeWidth={1.5} />
    </div>
  );
}
