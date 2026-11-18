import type { ColumnChoice } from "../-utils/columnChoices";

import { isEnumValue, TransactionColumn } from "@app/types";

import { TRANSACTION_COLUMN_LABELS } from "../-utils/columnChoices";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const IGNORE_VALUE = "__ignore";
const CUSTOM_VALUE = "__custom";

function toSelectValue(choice: ColumnChoice): string {
  if (choice.kind === "field") return choice.field;
  return choice.kind === "custom" ? CUSTOM_VALUE : IGNORE_VALUE;
}

function fromSelectValue(value: string, previous: ColumnChoice): ColumnChoice {
  if (isEnumValue(TransactionColumn, value)) {
    return {
      kind: "field",
      field: value,
    };
  }
  if (value === CUSTOM_VALUE) {
    return {
      kind: "custom",
      name: previous.kind === "custom" ? previous.name : "",
    };
  }
  return {
    kind: "ignore",
  };
}

interface ColumnMappingSelectProps {
  header: string;
  choice: ColumnChoice;
  onChange: (choice: ColumnChoice) => void;
}

/** The dropdown above one preview column: ignore it, map it to a Transaction field, or keep it as a custom field. */
export function ColumnMappingSelect({
  header, choice, onChange,
}: ColumnMappingSelectProps) {
  return (
    <div className="flex min-w-32 flex-col gap-1">
      <Select
        value={toSelectValue(choice)}
        onValueChange={value => onChange(fromSelectValue(value, choice))}
      >
        <SelectTrigger
          size="sm"
          aria-label={`Map column ${header}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={IGNORE_VALUE}>Ignore</SelectItem>
          <SelectSeparator />
          {(Object.entries(TRANSACTION_COLUMN_LABELS) as [TransactionColumn, string][]).map(([value, label]) => (
            <SelectItem
              key={value}
              value={value}
            >
              {label}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={CUSTOM_VALUE}>Custom…</SelectItem>
        </SelectContent>
      </Select>
      {choice.kind === "custom"
        ? (
          <Input
            className="h-8"
            aria-label={`Custom field name for ${header}`}
            placeholder="Field name"
            value={choice.name}
            onChange={e => onChange({
              kind: "custom",
              name: e.target.value,
            })}
          />
        )
        : null}
    </div>
  );
}
