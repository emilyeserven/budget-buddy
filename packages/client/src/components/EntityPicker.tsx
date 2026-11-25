import type { EntityType } from "@app/types";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEntity, useEntities } from "@/hooks/useEntities";

interface EntityPickerProps {
  label: string;
  value: string | null;
  onChange: (id: string) => void;
  /** The type given to an entity created from this picker. */
  newEntityType: EntityType;
}

/** Pick an existing entity, or type a new name and add it on the spot (it's then selected). */
export function EntityPicker({
  label, value, onChange, newEntityType,
}: EntityPickerProps) {
  const {
    data: entities = [],
  } = useEntities();
  const create = useCreateEntity();
  const [newName, setNewName] = useState("");

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    const entity = await create.mutateAsync({
      name,
      type: newEntityType,
    });
    setNewName("");
    onChange(entity.id);
  };

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        <Select
          value={value ?? ""}
          // Radix fires onValueChange("") when the value isn't among the items yet (e.g. right after
          // an inline create, before the entity list refetches) — ignore it so the pick sticks.
          onValueChange={(next) => {
            if (next) onChange(next);
          }}
        >
          <SelectTrigger aria-label={label}>
            <SelectValue placeholder={`Choose ${label.toLowerCase()}…`} />
          </SelectTrigger>
          <SelectContent>
            {entities.map(entity => (
              <SelectItem
                key={entity.id}
                value={entity.id}
              >
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-40"
          aria-label={`New ${label.toLowerCase()} name`}
          placeholder="…or add new"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!newName.trim() || create.isPending}
          onClick={() => void add()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
