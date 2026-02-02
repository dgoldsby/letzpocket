import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white appearance-none placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-lp-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-8",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 pointer-events-none opacity-50" />
      </div>
    );
  }
)
Select.displayName = "Select"

const SelectTrigger = Select;
const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} {...props} />
);
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, ...props }, ref) => <option ref={ref} className={cn(className)} {...props} />
);
SelectItem.displayName = "SelectItem";

const SelectValue = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  (props, ref) => <option ref={ref} {...props} disabled />
);
SelectValue.displayName = "SelectValue";

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
}
