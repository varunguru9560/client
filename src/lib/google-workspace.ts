import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App lazily/safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Workspace Scopes for Google Drive & Google Sheets
export const WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void,
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token missing, user might need to sign in again for OAuth scopes
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleWorkspaceSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Google Workspace Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const workspaceLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE DRIVE API HELPERS
// ==========================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
}

export async function listDriveFiles(
  accessToken: string,
  query: string = "trashed = false",
  pageSize: number = 20,
): Promise<DriveFileItem[]> {
  try {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.append(
      "fields",
      "files(id, name, mimeType, webViewLink, webContentLink, iconLink, thumbnailLink, createdTime, modifiedTime, size, parents)",
    );
    url.searchParams.append("pageSize", pageSize.toString());
    url.searchParams.append("orderBy", "modifiedTime desc");
    if (query) {
      url.searchParams.append("q", query);
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Drive API Error [${res.status}]: ${err}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error("Error listing Drive files:", error);
    throw error;
  }
}

export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string,
): Promise<DriveFileItem> {
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Drive folder [${res.status}]: ${err}`);
  }

  return await res.json();
}

export async function uploadFileToDrive(
  accessToken: string,
  file: File,
  parentFolderId?: string,
): Promise<DriveFileItem> {
  const metadata: { name: string; parents?: string[] } = {
    name: file.name,
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const formData = new FormData();
  formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  formData.append("file", file);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload file to Google Drive [${res.status}]: ${err}`);
  }

  return await res.json();
}

export async function deleteDriveFile(
  accessToken: string,
  fileId: string,
  fileName?: string,
): Promise<boolean> {
  const confirmMsg = fileName
    ? `Are you sure you want to delete "${fileName}" from Google Drive? This action cannot be undone.`
    : `Are you sure you want to delete this file from Google Drive?`;

  if (!window.confirm(confirmMsg)) {
    return false;
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Failed to delete file from Drive [${res.status}]: ${err}`);
  }

  return true;
}

// ==========================================
// GOOGLE SHEETS API HELPERS
// ==========================================

export interface SpreadsheetDetails {
  spreadsheetId: string;
  properties: {
    title: string;
  };
  spreadsheetUrl: string;
}

export async function createSpreadsheet(
  accessToken: string,
  title: string,
  headers: string[] = [],
): Promise<SpreadsheetDetails> {
  const requestBody: Record<string, unknown> = {
    properties: { title },
  };

  if (headers.length > 0) {
    requestBody.sheets = [
      {
        properties: { title: "Sheet1" },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map((h) => ({
                  userEnteredValue: { stringValue: h },
                })),
              },
            ],
          },
        ],
      },
    ];
  }

  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Google Spreadsheet [${res.status}]: ${err}`);
  }

  return await res.json();
}

export async function readSpreadsheetRows(
  accessToken: string,
  spreadsheetId: string,
  range: string = "Sheet1!A1:Z100",
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to read spreadsheet [${res.status}]: ${err}`);
  }

  const data = await res.json();
  return data.values || [];
}

export async function appendSpreadsheetRows(
  accessToken: string,
  spreadsheetId: string,
  range: string = "Sheet1!A:Z",
  values: string[][],
): Promise<Record<string, unknown>> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range,
  )}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to append rows to spreadsheet [${res.status}]: ${err}`);
  }

  return await res.json();
}
