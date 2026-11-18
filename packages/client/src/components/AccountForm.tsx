import type { Account } from "@app/types";

import { useState } from "react";

import { AccountType, EntityType } from "@app/types";

import { EntityPicker } from "@/components/EntityPicker";
import { EnumSelect } from "@/components/EnumSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAccount } from "@/hooks/useAccounts";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";

interface AccountFormProps {
  onCreated?: (account: Account) => void;
}

/**
 * Create an account: name, type, institution and owner (both creatable inline), and whether
 * imported amounts should be inverted. Used by the Accounts page and the CSV import flow.
 */
export function AccountForm({
  onCreated,
}: AccountFormProps) {
  const create = useCreateAccount();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>(AccountType.Checking);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [invertAmounts, setInvertAmounts] = useState(false);
  const ready = name.trim() !== "" && Boolean(institutionId) && Boolean(ownerId);

  const submit = async () => {
    if (!ready || !institutionId || !ownerId) return;
    const account = await create.mutateAsync({
      name: name.trim(),
      type,
      institutionId,
      ownerId,
      invertAmounts,
    });
    setName("");
    onCreated?.(account);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Input
          className="w-56"
          aria-label="Account name"
          placeholder="Account name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <EnumSelect
          aria-label="Account type"
          labels={ACCOUNT_TYPE_LABELS}
          value={type}
          onChange={setType}
        />
      </div>
      <EntityPicker
        label="Institution"
        value={institutionId}
        onChange={setInstitutionId}
        newEntityType={EntityType.Commercial}
      />
      <EntityPicker
        label="Owner"
        value={ownerId}
        onChange={setOwnerId}
        newEntityType={EntityType.Household}
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="invert-amounts"
          checked={invertAmounts}
          onCheckedChange={checked => setInvertAmounts(checked === true)}
        />
        <Label htmlFor="invert-amounts">
          Invert amounts on import (for CSVs that show charges as positive)
        </Label>
      </div>
      <Button
        type="submit"
        disabled={!ready || create.isPending}
      >
        Create account
      </Button>
    </form>
  );
}
