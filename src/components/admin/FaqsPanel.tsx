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
import { faqs as defaultFaqs } from "@/data/site";

type Row = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

export function FaqsPanel() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Partial<Row>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: async () => {
      const colRef = collection(db, "faqs");
      const q = query(colRef, orderBy("sort_order", "asc"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Seed default FAQs if Firestore is empty
        const initialList: Row[] = [];
        for (let i = 0; i < defaultFaqs.length; i++) {
          const f = defaultFaqs[i];
          const newDoc: Row = {
            id: `faq-${i + 1}`,
            question: f.q,
            answer: f.a,
            sort_order: i + 1,
            is_active: true,
          };
          initialList.push(newDoc);
          try {
            await setDoc(doc(db, "faqs", newDoc.id), newDoc);
          } catch {
            // ignore
          }
        }
        return initialList;
      }

      const list: Row[] = [];
      snapshot.forEach((d) => {
        const item = d.data();
        list.push({
          id: d.id,
          question: item.question || "",
          answer: item.answer || "",
          sort_order: Number(item.sort_order ?? 1),
          is_active: Boolean(item.is_active ?? true),
        });
      });
      return list;
    },
  });

  const done = () => {
    qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
    setDraft({});
  };

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const patch = draft[row.id] ?? {};
      const docRef = doc(db, "faqs", row.id);
      await updateDoc(docRef, {
        question: patch.question ?? row.question,
        answer: patch.answer ?? row.answer,
        sort_order: patch.sort_order ?? row.sort_order,
        is_active: patch.is_active ?? row.is_active,
      });
    },
    onSuccess: () => {
      toast.success("FAQ saved in Firebase");
      done();
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  const add = useMutation({
    mutationFn: async () => {
      const newId = "faq-" + Date.now().toString(36);
      const docRef = doc(db, "faqs", newId);
      await setDoc(docRef, {
        id: newId,
        question: "New question",
        answer: "Answer",
        sort_order: (data?.length ?? 0) + 1,
        is_active: true,
      });
    },
    onSuccess: done,
    onError: (e: Error) => toast.error("Could not add", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const docRef = doc(db, "faqs", id);
      await deleteDoc(docRef);
    },
    onSuccess: () => {
      toast.success("Deleted from Firebase");
      done();
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading FAQs…</p>;

  return (
    <div className="space-y-5">
      <Button variant="cta" onClick={() => add.mutate()}>
        Add FAQ
      </Button>
      {data?.map((row) => {
        const patch = draft[row.id] ?? {};
        const set = (v: Partial<Row>) =>
          setDraft((d) => ({ ...d, [row.id]: { ...d[row.id], ...v } }));
        return (
          <article key={row.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={patch.question ?? row.question}
                onChange={(e) => set({ question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <Textarea
                rows={4}
                value={patch.answer ?? row.answer}
                onChange={(e) => set({ answer: e.target.value })}
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
