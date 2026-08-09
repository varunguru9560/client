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
import { getStoredLeads, LeadItem } from "@/lib/leads.store";

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

    const loadLeads = () => {
      const stored = getStoredLeads();
      setLeadsList(stored.map((l) => ({ name: l.name, phone: l.phone, email: l.email })));
    };
    loadLeads();

    const handleDocsChange = () => reload();
    const handleLeadsChange = () => loadLeads();

    window.addEventListener("client-docs-changed", handleDocsChange);
    window.addEventListener("leads-changed", handleLeadsChange);
    return () => {
      window.removeEventListener("client-docs-changed", handleDocsChange);
      window.removeEventListener("leads-changed", handleLeadsChange);
    };
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

  // Group documents into distinct Client Pools
  const clientPoolsMap = new Map<
    string,
    {
      key: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      clientUploadedDocs: ClientDocument[];
      consultantUploadedDocs: ClientDocument[];
    }
  >();

  // 1. Populate from documents
  documents.forEach((doc) => {
    const key = normalizePhone(doc.clientPhone) || doc.clientEmail || doc.clientName;
    if (!clientPoolsMap.has(key)) {
      clientPoolsMap.set(key, {
        key,
        clientName: doc.clientName,
        clientPhone: doc.clientPhone,
        clientEmail: doc.clientEmail,
        clientUploadedDocs: [],
        consultantUploadedDocs: [],
      });
    }
    const pool = clientPoolsMap.get(key)!;
    if (doc.uploadedBy === "client") {
      pool.clientUploadedDocs.push(doc);
    } else {
      pool.consultantUploadedDocs.push(doc);
    }
  });

  // 2. Also populate from leads list if missing
  leadsList.forEach((lead) => {
    const key = normalizePhone(lead.phone) || lead.email || lead.name;
    if (!clientPoolsMap.has(key)) {
      clientPoolsMap.set(key, {
        key,
        clientName: lead.name,
        clientPhone: lead.phone,
        clientEmail: lead.email,
        clientUploadedDocs: [],
        consultantUploadedDocs: [],
      });
    }
  });

  const clientPools = Array.from(clientPoolsMap.values());

  const handleOpenUploadForPool = (pool: { name: string; phone: string; email?: string }) => {
    setClientName(pool.name);
    setClientPhone(pool.phone);
    setClientEmail(pool.email || "");
    setShowAddModal(true);
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

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

      {/* Client Pools Section */}
      <div className="space-y-8">
        {clientPools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No client pools found matching your filter.
          </div>
        ) : (
          clientPools
            .filter((pool) => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              const matchName = pool.clientName.toLowerCase().includes(q);
              const matchPhone = pool.clientPhone.includes(q);
              const matchEmail = pool.clientEmail?.toLowerCase().includes(q);
              const matchDoc = [...pool.clientUploadedDocs, ...pool.consultantUploadedDocs].some(
                (d) => d.title.toLowerCase().includes(q),
              );
              return matchName || matchPhone || matchEmail || matchDoc;
            })
            .map((pool) => {
              const clientDocsFiltered = pool.clientUploadedDocs.filter(
                (d) => filterCategory === "all" || d.category === filterCategory,
              );
              const consultantDocsFiltered = pool.consultantUploadedDocs.filter(
                (d) => filterCategory === "all" || d.category === filterCategory,
              );

              return (
                <div
                  key={pool.key}
                  className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
                >
                  {/* Client Pool Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-muted/30 p-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="size-5 text-brand" />
                        <h3 className="text-base font-bold text-foreground">{pool.clientName}</h3>
                        <Badge
                          variant="secondary"
                          className="bg-brand-soft text-brand font-semibold text-xs"
                        >
                          Client Pool
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="size-3 text-brand" /> +91 {pool.clientPhone}
                        </span>
                        {pool.clientEmail && <span>• {pool.clientEmail}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                      >
                        📥 {pool.clientUploadedDocs.length} Client Upload(s)
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300"
                      >
                        📤 {pool.consultantUploadedDocs.length} Consultant File(s)
                      </Badge>
                      <Button
                        size="sm"
                        variant="cta"
                        onClick={() =>
                          handleOpenUploadForPool({
                            name: pool.clientName,
                            phone: pool.clientPhone,
                            email: pool.clientEmail,
                          })
                        }
                        className="text-xs gap-1"
                      >
                        <Plus className="size-3.5" /> Upload File for{" "}
                        {pool.clientName.split(" ")[0]}
                      </Button>
                    </div>
                  </div>

                  {/* Two Separate Columns for this Client Pool */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border p-5 gap-6">
                    {/* COLUMN 1: CLIENT UPLOADS POOL */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                          <Upload className="size-4 text-blue-600" /> 📥 Documents Received from
                          Client
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono">
                          {clientDocsFiltered.length} item(s)
                        </span>
                      </div>

                      {clientDocsFiltered.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
                          No documents submitted by {pool.clientName} yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {clientDocsFiltered.map((doc) => (
                            <div
                              key={doc.id}
                              className="rounded-xl border border-blue-200/60 bg-blue-50/30 p-4 space-y-3 dark:bg-blue-950/20"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-100 text-blue-800 text-[0.65rem] font-semibold"
                                    >
                                      {doc.category}
                                    </Badge>
                                    <span className="text-[0.7rem] text-muted-foreground">
                                      {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <h5 className="font-semibold text-sm leading-snug">
                                    {doc.title}
                                  </h5>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(doc.id)}
                                  className="text-destructive size-7 shrink-0"
                                  title="Delete Document"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>

                              {doc.notes && (
                                <p className="text-xs text-muted-foreground bg-background/80 p-2 rounded border border-border/50">
                                  <strong>Client Note:</strong> {doc.notes}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-200/40">
                                {doc.driveUrl ? (
                                  <a
                                    href={doc.driveUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                  >
                                    <ExternalLink className="size-3" /> Drive Link
                                  </a>
                                ) : (
                                  <span className="text-[0.7rem] text-muted-foreground">
                                    {doc.fileName ? `File: ${doc.fileName}` : "Direct Upload"}
                                  </span>
                                )}

                                {doc.fileUrl ? (
                                  <a
                                    href={doc.fileUrl}
                                    download={doc.fileName || `${doc.title}.pdf`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand hover:bg-brand-deep px-2.5 py-1 rounded-md transition-colors"
                                  >
                                    <Download className="size-3" /> Download (
                                    {doc.fileSize || "File"})
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* COLUMN 2: CONSULTANT SHARED POOL */}
                    <div className="space-y-4 pt-6 lg:pt-0">
                      <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                          <FileText className="size-4 text-emerald-600" /> 📤 Documents Shared with
                          Client
                        </h4>
                        <span className="text-xs text-muted-foreground font-mono">
                          {consultantDocsFiltered.length} item(s)
                        </span>
                      </div>

                      {consultantDocsFiltered.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground space-y-2">
                          <p>No documents uploaded for this client yet.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleOpenUploadForPool({
                                name: pool.clientName,
                                phone: pool.clientPhone,
                                email: pool.clientEmail,
                              })
                            }
                            className="text-xs gap-1"
                          >
                            <Plus className="size-3" /> Upload Return / Certificate
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {consultantDocsFiltered.map((doc) => (
                            <div
                              key={doc.id}
                              className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-4 space-y-3 dark:bg-emerald-950/20"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="bg-emerald-100 text-emerald-800 text-[0.65rem] font-semibold"
                                    >
                                      {doc.category}
                                    </Badge>
                                    <span className="text-[0.7rem] text-muted-foreground">
                                      {new Date(doc.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <h5 className="font-semibold text-sm leading-snug">
                                    {doc.title}
                                  </h5>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(doc.id)}
                                  className="text-destructive size-7 shrink-0"
                                  title="Delete Document"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>

                              {doc.notes && (
                                <p className="text-xs text-muted-foreground bg-background/80 p-2 rounded border border-border/50">
                                  <strong>Filing Remarks:</strong> {doc.notes}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/40">
                                {doc.driveUrl ? (
                                  <a
                                    href={doc.driveUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                                  >
                                    <ExternalLink className="size-3" /> Google Drive Link
                                  </a>
                                ) : (
                                  <span className="text-[0.7rem] text-emerald-700 font-medium">
                                    ✓ Live on Client Portal
                                  </span>
                                )}

                                {doc.fileUrl ? (
                                  <a
                                    href={doc.fileUrl}
                                    download={doc.fileName || `${doc.title}.pdf`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-md transition-colors"
                                  >
                                    <Download className="size-3" /> Download (
                                    {doc.fileSize || "PDF"})
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
