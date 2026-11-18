import type { CsvFormat } from "@app/types";

import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/useAccounts";
import { useEntities } from "@/hooks/useEntities";

interface FormatChooserProps {
  matches: CsvFormat[];
  selected: CsvFormat | null;
  onChoose: (format: CsvFormat | null) => void;
}

/** Offer the saved formats this CSV fits, or manual column mapping (which saves a new format). */
export function FormatChooser({
  matches, selected, onChoose,
}: FormatChooserProps) {
  const {
    data: accounts = [],
  } = useAccounts();
  const {
    data: entities = [],
  } = useEntities();
  const ownerLabel = (format: CsvFormat) =>
    accounts.find(a => a.id === format.accountId)?.name
    ?? entities.find(e => e.id === format.institutionId)?.name;

  return (
    <section className="space-y-2">
      <h2 className="font-medium">How should this file be read?</h2>
      {matches.length === 0
        ? <p className="text-sm text-muted-foreground">No saved format matches this file — map its columns below.</p>
        : null}
      <div className="flex flex-wrap gap-2">
        {matches.map((format) => {
          const owner = ownerLabel(format);
          return (
            <Button
              key={format.id}
              type="button"
              variant={selected?.id === format.id ? "default" : "outline"}
              aria-pressed={selected?.id === format.id}
              onClick={() => onChoose(format)}
            >
              {`Read as ${format.name}${owner && owner !== format.name ? ` (${owner})` : ""}`}
            </Button>
          );
        })}
        <Button
          type="button"
          variant={selected === null ? "default" : "outline"}
          aria-pressed={selected === null}
          onClick={() => onChoose(null)}
        >
          Map columns manually
        </Button>
      </div>
    </section>
  );
}
