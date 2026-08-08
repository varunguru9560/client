import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Search,
  Phone,
  User,
  FolderPlus,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getAllClientDocuments,
  addClientDocument,
  deleteClientDocument,
  normalizePhone,
  ClientDocument,
} from "@/lib/client-vault";
import { supabase } from "@/integrations/supabase/client";

export function ClientDocumentsPanel() {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Document Form State
  const [clientPhone, setClientPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ClientDocument["category"]>("ITR Return");
  const [driveUrl, setDriveUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  // Existing leads for quick autocomplete
  const [leadsList, setLeadsList] = useState<{ name: string; phone: string; email?: string }[]>([]);

  const reload = () => {
    setDocuments(getAllClientDocuments());
  };

  useEffect(() => {
    reload();
    // Load leads from Supabase for easy autocomplete selector
    supabase
      .from("leads")
      .select("name, phone, email")
      .then(({ data }) => {
        if (data) {
          setLeadsList(data);
        }
      });

    const handleDocsChange = () => reload();
    window.addEventListener("client-docs-changed", handleDocsChange);
    return () => window.removeEventListener("client-docs-changed", handleDocsChange);
  }, []);

  const handleSelectLead = (phoneNum: string) => {
    const lead = leadsList.find((l) => l.phone === phoneNum);
    if (lead) {
      setClientPhone(lead.phone);
      setClientName(lead.name);
      if (lead.email) setClientEmail(lead.email);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(clientPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number for the client");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setBusy(true);

    let fileDataUrl = "";
    let fileName = "";
    let fileSize = "";

    if (file) {
      fileName = file.name;
      fileSize = `${(file.size / 1024).toFixed(0)} KB`;
      fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    addClientDocument({
      clientPhone: cleanPhone,
      clientName: clientName.trim() || `Client (${cleanPhone})`,
      clientEmail: clientEmail.trim(),
      title: title.trim(),
      category,
      uploadedBy: "consultant",
      uploaderName: "Shweta Singh (Admin)",
      fileUrl: fileDataUrl,
      driveUrl: driveUrl.trim(),
      fileName,
      fileSize,
      notes: notes.trim(),
    });

    setBusy(false);
    toast.success(`Document added for client +91 ${cleanPhone}`, {
      description: "Directly visible when the client logs in on the website plate.",
    });

    // Reset form
    setTitle("");
    setDriveUrl("");
    setNotes("");
    setFile(null);
    setShowAddModal(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteClientDocument(id);
    toast.success("Document deleted");
    reload();
  };

  const filteredDocs = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      doc.title.toLowerCase().includes(query) ||
      doc.clientName.toLowerCase().includes(query) ||
      doc.clientPhone.includes(query) ||
      (doc.clientEmail && doc.clientEmail.toLowerCase().includes(query));

    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FolderPlus className="size-5 text-brand" /> Client Documents & Google Drive Portal
          </h2>
          <p className="text-sm text-muted-foreground">
            Attach Google Drive links or upload tax returns for specific client mobile numbers.
          </p>
        </div>

        <Button onClick={() => setShowAddModal((v) => !v)} variant="cta" className="gap-2">
          <Plus className="size-4" />{" "}
          {showAddModal ? "Close Form" : "Add File / Drive Link for Client"}
        </Button>
      </div>

      {/* Add Document Form Panel */}
      {showAddModal && (
        <form
          onSubmit={handleCreateDocument}
          className="rounded-2xl border border-brand/30 bg-card p-6 shadow-[var(--shadow-card)] space-y-5"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Upload className="size-4 text-brand" /> Assign Document or Drive Link to Client
            </h3>
            <span className="text-xs text-muted-foreground">Appears directly on client login</span>
          </div>

          {/* Quick Select from Enquiries/Leads */}
          {leadsList.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Quick Select Client from Enquiries
              </Label>
              <Select onValueChange={handleSelectLead}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Select existing client/lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leadsList.map((lead, idx) => (
                    <SelectItem key={idx} value={lead.phone}>
                      {lead.name} (+91 {lead.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Client Mobile Number *</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-muted-foreground">
                  +91
                </span>
                <Input
                  id="admin-phone"
                  required
                  placeholder="9876543210"
                  className="pl-12 font-medium"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Client Name *</Label>
              <Input
                id="admin-name"
                required
                placeholder="Rahul Sharma"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Client Email (Optional)</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="rahul@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Document Title *</Label>
              <Input
                id="doc-title"
                required
                placeholder="e.g. AY 2025-26 Income Tax Return Acknowledgment"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-category">Document Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ClientDocument["category"])}
              >
                <SelectTrigger id="doc-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ITR Return">ITR Return</SelectItem>
                  <SelectItem value="GST Certificate">GST Certificate / Filing</SelectItem>
                  <SelectItem value="Form 16">Form 16 / Salary Slips</SelectItem>
                  <SelectItem value="Financial Statements">Financial Statements / Bank</SelectItem>
                  <SelectItem value="Audit Report">Audit Report</SelectItem>
                  <SelectItem value="Notice & Reply">Notice & Reply</SelectItem>
                  <SelectItem value="Other">Other Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-drive">Google Drive Link / Cloud URL</Label>
              <Input
                id="doc-drive"
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
              />
              <p className="text-[0.7rem] text-muted-foreground">
                Attach Google Drive sharing link for instant client access.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-file">OR Direct File Attachment (PDF / Image)</Label>
              <Input
                id="doc-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-notes">Notes / Filing Remarks for Client</Label>
            <Textarea
              id="doc-notes"
              rows={2}
              placeholder="e.g. Filed on 10 Aug 2026. Refund of ₹12,400 initiated."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="cta" disabled={busy} className="gap-2">
              <CheckCircle className="size-4" /> {busy ? "Saving..." : "Save & Share with Client"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client name, mobile number, or document title..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ITR Return">ITR Return</SelectItem>
            <SelectItem value="GST Certificate">GST Certificate</SelectItem>
            <SelectItem value="Form 16">Form 16</SelectItem>
            <SelectItem value="Financial Statements">Financial Statements</SelectItem>
            <SelectItem value="Audit Report">Audit Report</SelectItem>
            <SelectItem value="Notice & Reply">Notice & Reply</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No client documents found matching your filter.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <article
              key={doc.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-brand-soft text-brand font-semibold">
                      {doc.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        doc.uploadedBy === "consultant"
                          ? "border-emerald-500/30 text-emerald-600 bg-emerald-50 text-[0.7rem]"
                          : "border-blue-500/30 text-blue-600 bg-blue-50 text-[0.7rem]"
                      }
                    >
                      {doc.uploadedBy === "consultant"
                        ? "Uploaded by Consultant"
                        : "Uploaded by Client"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-foreground">{doc.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 text-xs sm:grid-cols-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <User className="size-3.5 text-brand" /> {doc.clientName}
                </div>
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Phone className="size-3.5 text-brand" /> +91 {doc.clientPhone}
                </div>
              </div>

              {doc.notes && (
                <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                  <strong>Notes:</strong> {doc.notes}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {doc.driveUrl && (
                  <a
                    href={doc.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline bg-brand-soft px-3 py-1.5 rounded-lg"
                  >
                    <ExternalLink className="size-3.5" /> Open Google Drive Link
                  </a>
                )}

                {doc.fileUrl ? (
                  <a
                    href={doc.fileUrl}
                    download={doc.fileName || `${doc.title}.pdf`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-deep px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="size-3.5" /> Download File ({doc.fileSize || "Attachment"})
                  </a>
                ) : (
                  !doc.driveUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("No attachment file uploaded")}
                      className="text-xs gap-1"
                    >
                      <Download className="size-3.5" /> No File
                    </Button>
                  )
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
