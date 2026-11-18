import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EnumSelectProps<V extends string> {
  /** Option value → display label (a `Record<Enum, string>` label map). */
  "labels": Record<V, string>;
  "value": V | null;
  "onChange": (value: V) => void;
  "aria-label": string;
  "placeholder"?: string;
  "disabled"?: boolean;
  "size"?: "sm" | "default";
}

/** A shadcn `Select` over one of the keyed enum objects, driven by its label map. */
export function EnumSelect<V extends string>({
  labels,
  value,
  onChange,
  placeholder = "Select…",
  disabled,
  size,
  "aria-label": ariaLabel,
}: EnumSelectProps<V>) {
  return (
    <Select
      value={value ?? ""}
      onValueChange={(next) => {
        if (next) onChange(next as V);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        size={size}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(labels) as [V, string][]).map(([option, label]) => (
          <SelectItem
            key={option}
            value={option}
          >
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
