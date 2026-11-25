import type { useColumnMapping } from "./useColumnMapping";

import { EnumSelect } from "@/components/EnumSelect";
import { Input } from "@/components/ui/input";
import { DATE_FORMAT_LABELS } from "@/lib/labels";

interface MappingOptionsProps {
  mapping: ReturnType<typeof useColumnMapping>;
  problems: string[];
}

/** Manual-mapping extras: the date layout, an optional format name, and what's still missing. */
export function MappingOptions({
  mapping, problems,
}: MappingOptionsProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Date format</span>
          <EnumSelect
            aria-label="Date format"
            labels={DATE_FORMAT_LABELS}
            value={mapping.dateFormat}
            onChange={mapping.setDateFormat}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Format name (optional)</span>
          <Input
            className="w-64"
            aria-label="Format name"
            placeholder="Defaults to the account name"
            value={mapping.formatName}
            onChange={e => mapping.setFormatName(e.target.value)}
          />
        </label>
      </div>
      {problems.length > 0
        ? (
          <ul className="list-disc pl-5 text-sm text-destructive">
            {problems.map(problem => <li key={problem}>{problem}</li>)}
          </ul>
        )
        : null}
    </section>
  );
}
