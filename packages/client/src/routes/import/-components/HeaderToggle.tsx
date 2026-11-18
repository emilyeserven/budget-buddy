import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface HeaderToggleProps {
  checked: boolean;
  onChange: (hasHeader: boolean) => void;
  /** Set when a saved format decides it (the format's own header setting applies). */
  lockedBy?: string | null;
}

/** Whether the file's first row holds column names (a headerless file treats every row as data). */
export function HeaderToggle({
  checked, onChange, lockedBy,
}: HeaderToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="csv-has-header"
        checked={checked}
        disabled={Boolean(lockedBy)}
        onCheckedChange={value => onChange(value === true)}
      />
      <Label htmlFor="csv-has-header">
        First row is a header
        {lockedBy ? <span className="font-normal text-muted-foreground">{` (set by ${lockedBy})`}</span> : null}
      </Label>
    </div>
  );
}
