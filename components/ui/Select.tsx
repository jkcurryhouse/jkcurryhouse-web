import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="font-body text-sm font-medium text-charcoal-800">
            {label}
            {props.required && <span className="text-spice-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none px-4 py-3 pr-10 font-body text-sm border bg-white text-charcoal-800",
              "focus:outline-none focus:ring-2 focus:ring-spice-400 focus:border-transparent",
              "transition-colors duration-150 cursor-pointer",
              error ? "border-spice-500" : "border-gray-300",
              className
            )}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {hint && !error && <p className="text-xs text-gray-400 font-body">{hint}</p>}
        {error && <p className="text-xs text-spice-500 font-body">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
export default Select;
