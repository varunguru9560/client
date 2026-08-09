import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
  Plus,
  Trash2,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
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
  getStoredClientUser,
  setStoredClientUser,
  getDocumentsForClient,
  addClientDocument,
  deleteClientDocument,
  normalizePhone,
  ClientDocument,
  ClientUser,
} from "@/lib/client-vault";
import { AuthModal } from "./AuthModal";

export function ClientPlateSection() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [quickEmail, setQuickEmail] = useState("");

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState<ClientDocument["category"]>("ITR Return");
  const [uploadDriveUrl, setUploadDriveUrl] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reload = () => {
    const loggedUser = getStoredClientUser();
    setUser(loggedUser);
    if (loggedUser) {
      const key = loggedUser.phone || loggedUser.email || "";
      const docs = getDocumentsForClient(key);
      setDocuments(docs);
    } else {
      setDocuments([]);
    }
  };

  useEffect(() => {
    reload();
    const handleAuthChange = () => reload();
    const handleDocsChange = () => reload();
    window.addEventListener("client-auth-changed", handleAuthChange);
    window.addEventListener("client-docs-changed", handleDocsChange);
    return () => {
      window.removeEventListener("client-auth-changed", handleAuthChange);
      window.removeEventListener("client-docs-changed", handleDocsChange);
    };
  }, []);

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = quickEmail.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setStoredClientUser({
      phone: "9876543210",
      name: cleanEmail.split("@")[0] || "Client User",
      email: cleanEmail,
      authProvider: "email",
      isLoggedIn: true,
    });
    toast.success(`Logged in as ${cleanEmail}`);
  };

  const handleClientFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!uploadTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setUploading(true);

    let fileDataUrl = "";
    let fileName = "";
    let fileSize = "";

    if (selectedFile) {
      fileName = selectedFile.name;
      fileSize = `${(selectedFile.size / 1024).toFixed(0)} KB`;
      fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
    }

    addClientDocument({
      clientPhone: user.phone || "9876543210",
      clientName: user.name || "Client",
      clientEmail: user.email,
      title: uploadTitle.trim(),
      category: uploadCategory,
      uploadedBy: "client",
      uploaderName: user.name || user.phone || "Client",
      fileUrl: fileDataUrl,
      driveUrl: uploadDriveUrl.trim(),
      fileName,
      fileSize,
      notes: uploadNotes.trim(),
    });

    setUploading(false);
    toast.success("Document uploaded successfully!", {
      description: "Your consultant can now access this file in their admin panel.",
    });

    // Reset form
    setUploadTitle("");
    setUploadDriveUrl("");
    setUploadNotes("");
    setSelectedFile(null);
    setShowUploadForm(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteClientDocument(id);
    toast.success("Document removed");
    reload();
  };

  const consultantDocs = documents.filter((d) => d.uploadedBy === "consultant");
  const clientUploadedDocs = documents.filter((d) => d.uploadedBy === "client");

  return (
    <section id="client-vault-plate" className="bg-muted/30 py-16">
      <div className="section-shell">
        <div className="mx-auto max-w-5xl rounded-[var(--radius-xl)] border border-brand/20 bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          {/* Header Banner Plate */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-foreground">
                  <FolderOpen className="size-5" />
                </span>
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  Client Document Vault & File Plate
                </h2>
                <Badge
                  variant="secondary"
                  className="gap-1 border-brand/30 bg-brand-soft text-brand font-semibold"
                >
                  <ShieldCheck className="size-3.5" /> Client Portal
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                View files and Google Drive links shared by your consultant or upload tax documents
                directly.
              </p>
            </div>

            {user?.isLoggedIn && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground">{user.name || "Client"}</p>
                  <p className="text-xs text-muted-foreground">+91 {user.phone}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStoredClientUser(null)}
                  className="rounded-full text-xs text-muted-foreground hover:text-destructive"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          {/* Body Content */}
          {!user?.isLoggedIn ? (
            <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-center">
              <div className="space-y-4 md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                  <Sparkles className="size-3.5" /> Instant Client Access
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Log in to access your tax returns, certificates & Drive links
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you log in with your email or Google account, any files or Google Drive links
                  attached by <strong>Shweta Singh (The Tax Maestro)</strong> in your name are
                  immediately visible here for easy 1-click download.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button variant="cta" onClick={() => setAuthModalOpen(true)} className="gap-2">
                    <Lock className="size-4" /> Log In / Sign Up to View Files
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAuthModalOpen(true)}
                    className="gap-2"
                  >
                    <svg className="size-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-5 md:col-span-5">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="size-4 text-brand" /> Quick Email Access
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter your registered email address to check documents instantly.
                </p>
                <form onSubmit={handleQuickLogin} className="mt-4 space-y-3">
                  <Input
                    type="email"
                    required
                    placeholder="client@example.com"
                    className="font-medium"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                  />
                  <Button type="submit" variant="brand" className="w-full text-xs font-semibold">
                    Access My Documents
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {/* Section 1: Documents Uploaded by Us / Consultant */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <FileText className="size-4 text-brand" /> Documents Shared by Consultant
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Tax filings, GST certificates, notices, and Drive links uploaded specifically
                      for +91 {user.phone}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {consultantDocs.length} File(s)
                  </Badge>
                </div>

                {consultantDocs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-muted/20">
                    <FolderOpen className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      No documents attached yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                      Any documents or Google Drive links added by the owner/admin under your mobile
                      number (+91 {user.phone}) will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {consultantDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand/40 hover:shadow-sm flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Badge
                              variant="secondary"
                              className="bg-brand-soft text-brand font-semibold text-[0.7rem]"
                            >
                              {doc.category}
                            </Badge>
                            <span className="text-[0.7rem] text-muted-foreground">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm leading-snug">{doc.title}</h4>
                          {doc.notes && (
                            <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
                              {doc.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                          {doc.driveUrl && (
                            <a
                              href={doc.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline bg-brand-soft px-3 py-1.5 rounded-lg"
                            >
                              <ExternalLink className="size-3.5" /> Open Google Drive
                            </a>
                          )}

                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName || `${doc.title}.pdf`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-deep px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Download className="size-3.5" /> Download File (
                              {doc.fileSize || "PDF"})
                            </a>
                          ) : (
                            !doc.driveUrl && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.info("Opening document details...")}
                                className="text-xs gap-1"
                              >
                                <Download className="size-3.5" /> Download
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Client Upload Section */}
              <div className="border-t border-border pt-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Upload className="size-4 text-brand" /> Upload Files / Drive Links to
                      Consultant
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Upload your bank statements, Form 16, or share a Google Drive link directly
                      with the consultant.
                    </p>
                  </div>
                  <Button
                    variant="brandOutline"
                    size="sm"
                    onClick={() => setShowUploadForm((v) => !v)}
                    className="gap-1 text-xs"
                  >
                    <Plus className="size-3.5" />{" "}
                    {showUploadForm ? "Cancel Upload" : "Upload New File / Link"}
                  </Button>
                </div>

                {showUploadForm && (
                  <form
                    onSubmit={handleClientFileUpload}
                    className="rounded-2xl border border-brand/30 bg-brand-soft/20 p-5 space-y-4 mb-6"
                  >
                    <h4 className="text-sm font-semibold text-foreground">
                      Upload Document Details
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="upload-title">Document Title *</Label>
                        <Input
                          id="upload-title"
                          required
                          placeholder="e.g. HDFC Bank Statement FY 2024-25"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="upload-cat">Document Category</Label>
                        <Select
                          value={uploadCategory}
                          onValueChange={(v) => setUploadCategory(v as ClientDocument["category"])}
                        >
                          <SelectTrigger id="upload-cat">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ITR Return">ITR / Income Tax</SelectItem>
                            <SelectItem value="Form 16">Form 16 / Salary Slips</SelectItem>
                            <SelectItem value="GST Certificate">GST Documents</SelectItem>
                            <SelectItem value="Financial Statements">
                              Bank & Financial Statements
                            </SelectItem>
                            <SelectItem value="Notice & Reply">Notice / Correspondence</SelectItem>
                            <SelectItem value="Audit Report">Audit Report</SelectItem>
                            <SelectItem value="Other">Other Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="upload-file">Select File (PDF / Image / Zip)</Label>
                        <Input
                          id="upload-file"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.zip,.docx"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="upload-drive">OR Paste Google Drive / External URL</Label>
                        <Input
                          id="upload-drive"
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={uploadDriveUrl}
                          onChange={(e) => setUploadDriveUrl(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="upload-notes">Notes / Instructions for Consultant</Label>
                      <Textarea
                        id="upload-notes"
                        rows={2}
                        placeholder="e.g. Attached bank statement for Q3 tax estimation."
                        value={uploadNotes}
                        onChange={(e) => setUploadNotes(e.target.value)}
                      />
                    </div>

                    <Button type="submit" variant="cta" disabled={uploading} className="gap-2">
                      {uploading ? "Uploading..." : "Submit Document to Consultant"}
                    </Button>
                  </form>
                )}

                {/* Client's Uploaded List */}
                {clientUploadedDocs.length > 0 && (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Files You Have Uploaded ({clientUploadedDocs.length})
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {clientUploadedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[0.65rem]">
                                {doc.category}
                              </Badge>
                              <span className="text-[0.65rem] text-muted-foreground">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-semibold text-sm">{doc.title}</p>
                            {doc.fileName && (
                              <p className="text-muted-foreground">File: {doc.fileName}</p>
                            )}
                            {doc.driveUrl && (
                              <a
                                href={doc.driveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                              >
                                <ExternalLink className="size-3" /> Drive Link
                              </a>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc.id)}
                            className="text-muted-foreground hover:text-destructive size-7"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </section>
  );
}
