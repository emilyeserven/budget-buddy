import type { Entity, UpdateEntityInput } from "@app/types";
import type { ColumnDef } from "@tanstack/react-table";

import { useState } from "react";

import { EntityType } from "@app/types";
import { Trash2 } from "lucide-react";

import { EnumSelect } from "@/components/EnumSelect";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useCreateEntity, useDeleteEntity, useEntities, useUpdateEntity } from "@/hooks/useEntities";
import { describeError } from "@/lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "@/lib/autoSave";
import { DEFAULT_SPLIT_LABELS, ENTITY_TYPE_LABELS } from "@/lib/labels";

/** Auto-save one field of an entity, toasting with the field's label. */
function useSaveEntityField(entity: Entity) {
  const update = useUpdateEntity();
  return (label: string, input: UpdateEntityInput) => update.mutate({
    id: entity.id,
    input,
  }, {
    onSuccess: () => notifyFieldSaved(label),
    onError: err => notifyFieldSaveError(label, describeError(err)),
  });
}

function NameCell({
  entity,
}: { entity: Entity }) {
  const save = useSaveEntityField(entity);
  return (
    <Input
      aria-label={`Name of ${entity.name}`}
      defaultValue={entity.name}
      onBlur={(e) => {
        const name = e.target.value.trim();
        if (name && name !== entity.name) save("Name", {
          name,
        });
      }}
    />
  );
}

function TypeCell({
  entity,
}: { entity: Entity }) {
  const save = useSaveEntityField(entity);
  return (
    <EnumSelect
      size="sm"
      aria-label={`Type of ${entity.name}`}
      labels={ENTITY_TYPE_LABELS}
      value={entity.type}
      onChange={(type) => {
        if (type !== entity.type) save("Type", {
          type,
        });
      }}
    />
  );
}

function DefaultSplitCell({
  entity,
}: { entity: Entity }) {
  const save = useSaveEntityField(entity);
  return (
    <EnumSelect
      size="sm"
      aria-label={`Default split for ${entity.name}`}
      labels={DEFAULT_SPLIT_LABELS}
      value={entity.defaultSplit}
      placeholder="—"
      onChange={(defaultSplit) => {
        if (defaultSplit !== entity.defaultSplit) save("Default split", {
          defaultSplit,
        });
      }}
    />
  );
}

function DeleteCell({
  entity,
}: { entity: Entity }) {
  const remove = useDeleteEntity();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete ${entity.name}`}
      onClick={() => remove.mutate(entity.id)}
    >
      <Trash2 />
    </Button>
  );
}

const columns: ColumnDef<Entity>[] = [
  {
    id: "name",
    header: "Name",
    meta: {
      fill: true,
    },
    cell: ({
      row,
    }) => <NameCell entity={row.original} />,
  },
  {
    id: "type",
    header: "Type",
    size: 160,
    cell: ({
      row,
    }) => <TypeCell entity={row.original} />,
  },
  {
    id: "defaultSplit",
    header: "Default split",
    size: 160,
    cell: ({
      row,
    }) => <DefaultSplitCell entity={row.original} />,
  },
  {
    id: "delete",
    header: "",
    size: 56,
    cell: ({
      row,
    }) => <DeleteCell entity={row.original} />,
  },
];

function CreateEntityForm() {
  const create = useCreateEntity();
  const [name, setName] = useState("");
  const [type, setType] = useState<EntityType>(EntityType.Commercial);
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        create.mutate({
          name: name.trim(),
          type,
        }, {
          onSuccess: () => setName(""),
        });
      }}
    >
      <Input
        className="w-64"
        aria-label="New entity name"
        placeholder="New entity name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <EnumSelect
        aria-label="New entity type"
        labels={ENTITY_TYPE_LABELS}
        value={type}
        onChange={setType}
      />
      <Button
        type="submit"
        disabled={!name.trim() || create.isPending}
      >
        Add
      </Button>
    </form>
  );
}

/** Merchants, institutions, friends and household members; fields auto-save. */
export function EntitiesManager() {
  const {
    data: entities = [], isLoading,
  } = useEntities();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Entities</h1>
      <CreateEntityForm />
      {isLoading
        ? <p className="text-muted-foreground">Loading…</p>
        : (
          <DataTable
            columns={columns}
            data={entities}
            emptyMessage="No entities yet."
          />
        )}
    </div>
  );
}
