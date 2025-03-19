import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

export function Spinner({ className, size = 24, ...props }: SpinnerProps) {
  return (
    <div 
      role="status"
      aria-label="Loading"
      className={cn("animate-spin text-primary", className)} 
      {...props}
    >
      <Loader2 size={size} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}