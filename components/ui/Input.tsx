import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="font-body text-sm font-medium text-charcoal-800">
            {label}
            {props.required && <span className="text-spice-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-3 font-body text-sm border bg-white text-charcoal-800",
            "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-spice-400 focus:border-transparent",
            "transition-colors duration-150",
            error ? "border-spice-500" : "border-gray-300",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-400 font-body">{hint}</p>}
        {error && <p className="text-xs text-spice-500 font-body">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
