import { useEffect, useState, useRef } from "react";
import {
  googleWorkspaceSignIn,
  initWorkspaceAuth,
  listDriveFiles,
  uploadFileToDrive,
  createDriveFolder,
  deleteDriveFile,
  createSpreadsheet,
  readSpreadsheetRows,
  appendSpreadsheetRows,
  workspaceLogout,
  type DriveFileItem,
} from "@/lib/google-workspace";
import { addClientDocument } from "@/lib/client-vault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  FolderPlus,
  Upload,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  FileText,
  FileSpreadsheet,
  Folder,
  LogOut,
  Plus,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

import { type User } from "firebase/auth";

export function GoogleWorkspacePanel() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loadingDrive, setLoadingDrive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string>(
    "1ba-FoB8m_je1-N2G0Mj8qg275AhaWbvNeBO8U-BROXU",
  );
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [loadingSheet, setLoadingSheet] = useState<boolean>(false);
  const [newSheetTitle, setNewSheetTitle] = useState<string>("Tax Maestro Enquiries FY 2025-26");
  const [creatingSheet, setCreatingSheet] = useState<boolean>(false);

  // Append Row Form
  const [appendName, setAppendName] = useState("");
  const [appendPhone, setAppendPhone] = useState("");
  const [appendEmail, setAppendEmail] = useState("");
  const [appendService, setAppendService] = useState("");
  const [appendMessage, setAppendMessage] = useState("");
  const [appending, setAppending] = useState(false);

  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
        setLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (token) {
      loadDriveFiles();
      loadSheetRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const res = await googleWorkspaceSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        toast.success("Signed in with Google Workspace!");
      }
    } catch (err) {
      const error = err as Error;
      toast.error("Google Sign-In failed", {
        description: error?.message || "Could not complete authentication.",
      });
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await workspaceLogout();
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    setSheetRows([]);
    toast.info("Signed out from Google Workspace");
  };

  const loadDriveFiles = async () => {
    if (!token) return;
    setLoadingDrive(true);
    try {
      const files = await listDriveFiles(token);
      setDriveFiles(files);
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to load Google Drive files", {
        description: error?.message,
      });
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!token || !newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const folder = await createDriveFolder(token, newFolderName.trim());
      toast.success(`Created folder "${folder.name}" in Google Drive!`);
      setNewFolderName("");
      loadDriveFiles();
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to create folder", { description: error?.message });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const uploaded = await uploadFileToDrive(token, file);
      toast.success(`Uploaded "${uploaded.name}" to Google Drive!`);
      loadDriveFiles();
    } catch (err) {
      const error = err as Error;
      toast.error("Drive Upload failed", { description: error?.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (file: DriveFileItem) => {
    if (!token) return;
    try {
      const deleted = await deleteDriveFile(token, file.id, file.name);
      if (deleted) {
        toast.success(`Deleted "${file.name}" from Google Drive`);
        setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
      }
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to delete file", { description: error?.message });
    }
  };

  const handleAttachToClientVault = (file: DriveFileItem) => {
    const link = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
    addClientDocument({
      clientPhone: "",
      clientName: user?.displayName || user?.email?.split("@")[0] || "Client User",
      clientEmail: user?.email || "client@example.com",
      title: file.name,
      category: file.name.toLowerCase().includes("itr")
        ? "ITR Return"
        : file.name.toLowerCase().includes("gst")
          ? "GST Certificate"
          : "Other",
      uploadedBy: "consultant",
      uploaderName: user?.displayName || "Shweta Singh (The Tax Maestro)",
      driveUrl: link,
      fileName: file.name,
      fileSize: file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : "Drive File",
      notes: "Attached directly from Google Drive",
    });
    toast.success(`Linked "${file.name}" to Client Vault!`);
  };

  // Google Sheets Functions
  const loadSheetRows = async () => {
    if (!token || !spreadsheetId) return;
    setLoadingSheet(true);
    try {
      const rows = await readSpreadsheetRows(token, spreadsheetId, "Sheet1!A1:G50");
      setSheetRows(rows);
    } catch (err) {
      const error = err as Error;
      toast.error("Could not read Google Sheet", { description: error?.message });
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!token || !newSheetTitle.trim()) return;
    setCreatingSheet(true);
    try {
      const headers = [
        "Timestamp",
        "Client Name",
        "Phone",
        "Email",
        "Service",
        "Message",
        "Status",
      ];
      const created = await createSpreadsheet(token, newSheetTitle.trim(), headers);
      setSpreadsheetId(created.spreadsheetId);
      toast.success(`Created Google Sheet: "${created.properties.title}"!`);
      loadSheetRows();
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to create Google Sheet", { description: error?.message });
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleAppendRow = async () => {
    if (!token || !spreadsheetId || !appendName.trim() || !appendPhone.trim()) {
      toast.error("Please provide at least Name and Phone number");
      return;
    }
    setAppending(true);
    try {
      const newRow = [
        new Date().toLocaleString("en-IN"),
        appendName.trim(),
        appendPhone.trim(),
        appendEmail.trim(),
        appendService || "General Tax Consultation",
        appendMessage.trim() || "Manual enquiry entry",
        "New",
      ];
      await appendSpreadsheetRows(token, spreadsheetId, "Sheet1!A:G", [newRow]);
      toast.success("Row appended to Google Sheet!");
      setAppendName("");
      setAppendPhone("");
      setAppendEmail("");
      setAppendService("");
      setAppendMessage("");
      loadSheetRows();
    } catch (err) {
      const error = err as Error;
      toast.error("Failed to append row", { description: error?.message });
    } finally {
      setAppending(false);
    }
  };

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="size-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Connecting to Google Workspace...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="border-primary/20 bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderPlus className="size-6" />
          </div>
          <CardTitle className="mt-2 text-xl font-bold">
            Google Drive & Google Sheets Integration
          </CardTitle>
          <CardDescription className="mx-auto max-w-md">
            Connect your Google account to manage tax documents in Google Drive and sync client
            enquiries directly to Google Sheets with full authorization.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Button
            size="lg"
            onClick={handleSignIn}
            disabled={signingIn}
            className="flex items-center gap-3 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 shadow-sm font-medium px-6 py-5 rounded-lg text-base"
          >
            <svg className="size-5" viewBox="0 0 24 24">
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
            {signingIn ? "Connecting..." : "Sign in with Google Workspace"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Info Header */}
      <Card className="border-border">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="size-10 rounded-full border" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {user?.displayName ? user.displayName.charAt(0) : "G"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {user?.displayName || "Google Workspace User"}
                </span>
                <Badge
                  variant="secondary"
                  className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  <CheckCircle2 className="size-3" /> Workspace Authorized
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="mr-2 size-4" /> Disconnect
          </Button>
        </CardContent>
      </Card>

      {/* Tabs for Google Drive and Google Sheets */}
      <Tabs defaultValue="drive" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drive" className="flex items-center gap-2">
            <Folder className="size-4" /> Google Drive Explorer
          </TabsTrigger>
          <TabsTrigger value="sheets" className="flex items-center gap-2">
            <FileSpreadsheet className="size-4" /> Google Sheets Center
          </TabsTrigger>
        </TabsList>

        {/* GOOGLE DRIVE TAB */}
        <TabsContent value="drive" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Google Drive Files</CardTitle>
                  <CardDescription>
                    Browse your Google Drive, upload client tax files, or create client folders.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="drive-upload-input"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className={uploading ? "size-4 animate-spin" : "size-4"} />
                    {uploading ? "Uploading..." : "Upload to Drive"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDriveFiles}
                    disabled={loadingDrive}
                  >
                    <RefreshCw className={loadingDrive ? "size-4 animate-spin" : "size-4"} />{" "}
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Folder Creation and Search */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New Folder Name (e.g., Client Vault AY25-26)"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleCreateFolder}
                    disabled={creatingFolder || !newFolderName.trim()}
                  >
                    <FolderPlus className="mr-2 size-4" />
                    Create
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search files in Google Drive..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* File List */}
              {loadingDrive ? (
                <div className="flex justify-center p-8 text-sm text-muted-foreground">
                  <RefreshCw className="mr-2 size-4 animate-spin" /> Fetching files from Google
                  Drive...
                </div>
              ) : filteredDriveFiles.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No files found in Google Drive matching your criteria. Upload a file above!
                </div>
              ) : (
                <div className="divide-y divide-border rounded-md border">
                  {filteredDriveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {file.mimeType.includes("folder") ? (
                          <Folder className="size-5 shrink-0 text-amber-500" />
                        ) : file.mimeType.includes("spreadsheet") ||
                          file.name.endsWith(".xlsx") ||
                          file.name.endsWith(".csv") ? (
                          <FileSpreadsheet className="size-5 shrink-0 text-emerald-600" />
                        ) : (
                          <FileText className="size-5 shrink-0 text-primary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size
                              ? `${(parseInt(file.size) / 1024).toFixed(1)} KB`
                              : "Folder / Drive File"}{" "}
                            • Modified{" "}
                            {new Date(file.modifiedTime || Date.now()).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAttachToClientVault(file)}
                          className="h-8 text-xs gap-1"
                        >
                          <PlusCircle className="size-3.5" /> Attach to Vault
                        </Button>
                        {file.webViewLink && (
                          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file)}
                          className="h-8 px-2 text-muted-foreground hover:text-destructive"
                          title="Delete from Drive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOOGLE SHEETS TAB */}
        <TabsContent value="sheets" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Google Sheets Lead Sync & Manager</CardTitle>
                  <CardDescription>
                    Direct read & write interface to Google Spreadsheets in your Google Drive.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSheetRows}
                    disabled={loadingSheet}
                  >
                    <RefreshCw className={loadingSheet ? "size-4 animate-spin" : "size-4"} /> Read
                    Rows
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="size-4" /> Open Sheet
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Spreadsheet ID / Create Controls */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Active Google Spreadsheet ID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      placeholder="Enter Google Sheet ID..."
                    />
                    <Button onClick={loadSheetRows} disabled={loadingSheet}>
                      Connect
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Create New Google Sheet in Drive</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSheetTitle}
                      onChange={(e) => setNewSheetTitle(e.target.value)}
                      placeholder="Spreadsheet Title..."
                    />
                    <Button
                      variant="secondary"
                      onClick={handleCreateNewSheet}
                      disabled={creatingSheet}
                    >
                      <Plus className="mr-1 size-4" /> Create
                    </Button>
                  </div>
                </div>
              </div>

              {/* Append Row Direct Form */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <PlusCircle className="size-4 text-primary" /> Append New Record to Connected
                  Google Sheet
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <Input
                    placeholder="Client Name *"
                    value={appendName}
                    onChange={(e) => setAppendName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone Number *"
                    value={appendPhone}
                    onChange={(e) => setAppendPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Email Address"
                    value={appendEmail}
                    onChange={(e) => setAppendEmail(e.target.value)}
                  />
                  <Input
                    placeholder="Service (e.g. GST Filing)"
                    value={appendService}
                    onChange={(e) => setAppendService(e.target.value)}
                  />
                  <Input
                    placeholder="Message / Notes"
                    value={appendMessage}
                    onChange={(e) => setAppendMessage(e.target.value)}
                    className="sm:col-span-2 md:col-span-2"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAppendRow} disabled={appending} size="sm">
                    {appending ? "Appending..." : "Append Row to Google Sheet"}
                  </Button>
                </div>
              </div>

              {/* Sheet Live Table Display */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Live Rows Preview (Spreadsheet ID: {spreadsheetId})
                </h4>
                {loadingSheet ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <RefreshCw className="mr-2 inline size-4 animate-spin" /> Loading spreadsheet
                    data...
                  </div>
                ) : sheetRows.length === 0 ? (
                  <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                    No data rows found in range Sheet1!A1:G50. Append a record above or click
                    Refresh.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted font-semibold text-muted-foreground">
                        <tr>
                          {sheetRows[0]?.map((cell, idx) => (
                            <th key={idx} className="p-3 border-b">
                              {cell || `Col ${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sheetRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-muted/50">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
