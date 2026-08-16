import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { iconOptions } from "@/lib/site-content";
import { serviceGroups as defaultServiceGroups } from "@/data/site";

type Row = {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  items: string[];
  sort_order: number;
  is_active: boolean;
};

export function ServicesPanel() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Partial<Row> & { itemsText?: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "service_groups"],
    queryFn: async () => {
      const colRef = collection(db, "service_groups");
      const q = query(colRef, orderBy("sort_order", "asc"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Seed default groups if Firestore collection is empty
        const initialList: Row[] = [];
        for (let i = 0; i < defaultServiceGroups.length; i++) {
          const group = defaultServiceGroups[i];
          const newDoc: Row = {
            id: group.id || `srv-${i + 1}`,
            title: group.title,
            icon: group.icon || "Sparkles",
            blurb: group.blurb || "",
            items: group.items || [],
            sort_order: i + 1,
            is_active: true,
          };
          initialList.push(newDoc);
          try {
            await setDoc(doc(db, "service_groups", newDoc.id), newDoc);
          } catch {
            // ignore seed write failure
          }
        }
        return initialList;
      }

      const list: Row[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        list.push({
          id: d.id,
          title: item.title || "",
          icon: item.icon || "Sparkles",
          blurb: item.blurb || "",
          items: item.items || [],
          sort_order: Number(item.sort_order ?? 1),
          is_active: Boolean(item.is_active ?? true),
        });
      });
      return list;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "service_groups"] });
    setDraft({});
  };

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const patch = draft[row.id] ?? {};
      const items =
        patch.itemsText !== undefined
          ? patch.itemsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : row.items;

      const docRef = doc(db, "service_groups", row.id);
      await updateDoc(docRef, {
        title: patch.title ?? row.title,
        icon: patch.icon ?? row.icon,
        blurb: patch.blurb ?? row.blurb,
        sort_order: patch.sort_order ?? row.sort_order,
        is_active: patch.is_active ?? row.is_active,
        items,
      });
    },
    onSuccess: () => {
      toast.success("Service group saved in Firebase");
      invalidate();
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const add = useMutation({
    mutationFn: async () => {
      const newId = "srv-" + Date.now().toString(36);
      const docRef = doc(db, "service_groups", newId);
      await setDoc(docRef, {
        id: newId,
        title: "New service group",
        icon: "Sparkles",
        blurb: "",
        items: [],
        sort_order: (data?.length ?? 0) + 1,
        is_active: true,
      });
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error("Could not add", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const docRef = doc(db, "service_groups", id);
      await deleteDoc(docRef);
    },
    onSuccess: () => {
      toast.success("Deleted from Firebase");
      invalidate();
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading services…</p>;

  return (
    <div className="space-y-5">
      <Button variant="cta" onClick={() => add.mutate()}>
        Add service group
      </Button>

      {data?.map((row) => {
        const patch = draft[row.id] ?? {};
        const set = (v: Partial<Row> & { itemsText?: string }) =>
          setDraft((d) => ({ ...d, [row.id]: { ...d[row.id], ...v } }));
        return (
          <article key={row.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={patch.title ?? row.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={patch.icon ?? row.icon} onValueChange={(icon) => set({ icon })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconOptions).map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short description</Label>
              <Textarea
                value={patch.blurb ?? row.blurb}
                onChange={(e) => set({ blurb: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Services (one per line)</Label>
              <Textarea
                rows={6}
                value={patch.itemsText ?? row.items.join("\n")}
                onChange={(e) => set({ itemsText: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Order</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={patch.sort_order ?? row.sort_order}
                  onChange={(e) => set({ sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={patch.is_active ?? row.is_active}
                  onCheckedChange={(is_active) => set({ is_active })}
                />
                <Label className="text-sm">Visible on site</Label>
              </div>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => remove.mutate(row.id)}>
                  Delete
                </Button>
                <Button variant="brand" size="sm" onClick={() => save.mutate(row)}>
                  Save
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
