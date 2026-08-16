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
  fetchFirebaseClientDocuments,
  subscribeToClientDocuments,
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

    // Fetch initial docs from Firebase
    fetchFirebaseClientDocuments().then(() => reload());

    const unsubscribe = subscribeToClientDocuments(() => {
      reload();
    });

    const handleAuthChange = () => reload();
    const handleDocsChange = () => reload();
    window.addEventListener("client-auth-changed", handleAuthChange);
    window.addEventListener("client-docs-changed", handleDocsChange);
    return () => {
      unsubscribe();
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
      phone: "",
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

      // Convert file to Data URL for instant storage & preview
      fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });
    }

    await addClientDocument({
      clientPhone: user.phone || "",
      clientName: user.name || "Client",
      clientEmail: user.email,
      title: uploadTitle.trim(),
      category: uploadCategory,
      uploadedBy: "client",
      uploaderName: user.name || user.email || "Client",
      fileUrl: fileDataUrl,
      driveUrl: uploadDriveUrl.trim(),
      fileName,
      fileSize,
      notes: uploadNotes.trim(),
    });

    setUploading(false);
    toast.success("Document uploaded successfully!", {
      description: "Stored securely in your client pool and visible to your tax consultant.",
    });

    // Reset Form
    setUploadTitle("");
    setUploadDriveUrl("");
    setUploadNotes("");
    setSelectedFile(null);
    setShowUploadForm(false);
    reload();
  };

  const handleDelete = async (id: string) => {
    await deleteClientDocument(id);
    toast.success("Document deleted");
    reload();
  };

  const handleLogout = () => {
    setStoredClientUser(null);
    toast.info("Logged out from client portal");
  };

  const clientUploads = documents.filter((d) => d.uploadedBy === "client");
  const consultantUploads = documents.filter((d) => d.uploadedBy === "consultant");

  return (
    <section
      id="client-plate"
      className="relative overflow-hidden bg-card/60 py-16 sm:py-24 border-y border-border/80"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header with Title & Live Status */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/80">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <ShieldCheck className="size-4 text-brand" /> Secure Client Document Vault
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Your Personal Tax & Filing Plate
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Direct, private repository between you and your tax consultant. Download completed ITR
              acknowledgments and GST certificates, or upload financial statements.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground">
                  {user.name || user.email || "Client"}
                </span>
                {user.email && (
                  <span className="font-mono text-muted-foreground">({user.email})</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs h-8 text-destructive hover:bg-destructive/10"
              >
                Log Out
              </Button>
            </div>
          )}
        </div>

        {/* Content Body: Either Login Box OR Active Client Plate */}
        {!user ? (
          <div className="mt-8 grid gap-8 md:grid-cols-2 items-center rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm">
            <div className="space-y-4">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <Lock className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Access Your Private Client Plate
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Log in securely to view documents shared by your consultant or upload your bills and
                financial statements.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Instant access to ITR acknowledgements & computations</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Upload documents securely to your private folder</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Real-time synchronisation with your consultant&apos;s workspace</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-muted/40 p-6 space-y-4">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Mail className="size-4 text-brand" /> Quick Access with Email / Google
              </h4>

              <form onSubmit={handleQuickLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="client-quick-email" className="text-xs">
                    Your Email Address
                  </Label>
                  <Input
                    id="client-quick-email"
                    type="email"
                    required
                    placeholder="e.g. client@example.com"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
                <Button type="submit" variant="cta" className="w-full h-10 text-sm">
                  View My Documents
                </Button>
              </form>

              <div className="relative text-center text-xs text-muted-foreground uppercase my-2">
                <span className="bg-muted/40 px-2">Or</span>
                <div className="absolute inset-0 top-1/2 -z-10 border-t border-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setAuthModalOpen(true)}
                className="w-full h-10 text-sm border-border bg-card hover:bg-accent"
              >
                Sign In with Google or Password
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Top Action Bar for Logged in Client */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand font-bold text-sm">
                  {user.name ? user.name[0].toUpperCase() : "C"}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {user.name || "Client Vault"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {user.email ? `Email: ${user.email}` : "Client Profile Active"}
                  </p>
                </div>
              </div>

              <Button
                variant="cta"
                size="sm"
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="gap-1.5 text-xs shadow-xs"
              >
                <Plus className="size-4" />
                {showUploadForm ? "Close Upload Form" : "Upload Document for Consultant"}
              </Button>
            </div>

            {/* Upload Document Modal/Collapsible Box */}
            {showUploadForm && (
              <form
                onSubmit={handleClientFileUpload}
                className="rounded-2xl border border-brand/30 bg-brand-soft/20 p-6 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-brand/20 pb-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-brand">
                    <Upload className="size-4" /> Upload Document to Consultant
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Client: {user.name || user.email}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="upload-title" className="text-xs font-semibold">
                      Document Title *
                    </Label>
                    <Input
                      id="upload-title"
                      required
                      placeholder="e.g. Bank Statement April-March, Form 16"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="bg-background text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="upload-cat" className="text-xs font-semibold">
                      Category *
                    </Label>
                    <Select
                      value={uploadCategory}
                      onValueChange={(val: ClientDocument["category"]) => setUploadCategory(val)}
                    >
                      <SelectTrigger id="upload-cat" className="bg-background text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ITR Return">ITR Return</SelectItem>
                        <SelectItem value="GST Certificate">GST Certificate</SelectItem>
                        <SelectItem value="Audit Report">Audit Report</SelectItem>
                        <SelectItem value="Form 16">Form 16</SelectItem>
                        <SelectItem value="Notice & Reply">Notice & Reply</SelectItem>
                        <SelectItem value="Financial Statements">Financial Statements</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="upload-file" className="text-xs font-semibold">
                      Select File (PDF, Image, Excel, ZIP)
                    </Label>
                    <Input
                      id="upload-file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="bg-background text-xs h-9 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="upload-drive" className="text-xs font-semibold">
                      Or Google Drive / Cloud Link (Optional)
                    </Label>
                    <Input
                      id="upload-drive"
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={uploadDriveUrl}
                      onChange={(e) => setUploadDriveUrl(e.target.value)}
                      className="bg-background text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="upload-notes" className="text-xs font-semibold">
                    Notes / Remarks for Consultant (Optional)
                  </Label>
                  <Textarea
                    id="upload-notes"
                    rows={2}
                    placeholder="e.g. Please find the statement attached for FY 2024-25 filing..."
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="bg-background text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand/20">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="cta"
                    size="sm"
                    disabled={uploading}
                    className="text-xs"
                  >
                    {uploading ? "Uploading…" : "Upload to Vault"}
                  </Button>
                </div>
              </form>
            )}

            {/* Two Side-by-Side Vault Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION 1: DOCUMENTS FROM CONSULTANT */}
              <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        📤 Completed Returns & Filings
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Official acknowledgements uploaded for you
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {consultantUploads.length} Item(s)
                  </Badge>
                </div>

                {consultantUploads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
                    <FolderOpen className="size-8 mx-auto text-muted-foreground/50" />
                    <p>No filed documents uploaded by your consultant yet.</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      Once filed, your computation sheet and ITR-V will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consultantUploads.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-3 dark:bg-emerald-950/20"
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
                            <h4 className="font-semibold text-sm text-foreground">{doc.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Shared by: {doc.uploaderName}
                            </p>
                          </div>
                        </div>

                        {doc.notes && (
                          <p className="text-xs text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/50">
                            <strong>Remark:</strong> {doc.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/50">
                          {doc.driveUrl ? (
                            <a
                              href={doc.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                            >
                              <ExternalLink className="size-3.5" /> Open Google Drive File
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">
                              {doc.fileName ? `File: ${doc.fileName}` : "Official Document"}
                            </span>
                          )}

                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName || `${doc.title}.pdf`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Download className="size-3.5" /> Download ({doc.fileSize || "File"})
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: DOCUMENTS UPLOADED BY CLIENT */}
              <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="size-5 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        📥 My Uploaded Documents
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Files you have shared with the consultant
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {clientUploads.length} Item(s)
                  </Badge>
                </div>

                {clientUploads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-2">
                    <Upload className="size-8 mx-auto text-muted-foreground/50" />
                    <p>You have not uploaded any documents yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUploadForm(true)}
                      className="text-xs mt-2"
                    >
                      <Plus className="size-3 mr-1" /> Upload Your First Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientUploads.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-3 dark:bg-blue-950/20"
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
                            <h4 className="font-semibold text-sm text-foreground">{doc.title}</h4>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc.id)}
                            className="text-destructive size-7 shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        {doc.notes && (
                          <p className="text-xs text-muted-foreground bg-background/80 p-2 rounded-lg border border-border/50">
                            <strong>Note:</strong> {doc.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-200/50">
                          {doc.driveUrl ? (
                            <a
                              href={doc.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                            >
                              <ExternalLink className="size-3.5" /> Drive Link
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">
                              {doc.fileName ? `File: ${doc.fileName}` : "Uploaded File"}
                            </span>
                          )}

                          {doc.fileUrl ? (
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName || `${doc.title}.pdf`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Download className="size-3.5" /> Download ({doc.fileSize || "File"})
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
        )}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </section>
  );
}
