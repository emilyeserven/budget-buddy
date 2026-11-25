import { useState } from "react";

import { AccountForm } from "@/components/AccountForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";

interface AccountChooserProps {
  value: string | null;
  onChange: (id: string) => void;
}

/** Pick the account the transactions belong to, or create one in a dialog. */
export function AccountChooser({
  value, onChange,
}: AccountChooserProps) {
  const {
    data: accounts = [],
  } = useAccounts();
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-2">
      <h2 className="font-medium">Account</h2>
      <div className="flex flex-wrap gap-2">
        <Select
          value={value ?? ""}
          // Ignore Radix's onValueChange("") while a just-created account isn't in the list yet.
          onValueChange={(next) => {
            if (next) onChange(next);
          }}
        >
          <SelectTrigger aria-label="Account">
            <SelectValue placeholder="Choose an account…" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(account => (
              <SelectItem
                key={account.id}
                value={account.id}
              >
                {`${account.name} — ${account.institutionName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
            >
              New account…
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New account</DialogTitle>
            </DialogHeader>
            <AccountForm
              onCreated={(account) => {
                onChange(account.id);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
