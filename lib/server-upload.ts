"use client"

import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface ServerUploadResult {
  success: boolean;
  CID: string | null;
  // Back-compat fields if server returns extended info
  ok?: boolean;
  cid?: string | null;
  file_key?: string;
  file_record?: any;
  gateway_url?: string;
}

export async function signMessage(message: string): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available");
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error: any) {
    throw new Error(`Failed to sign message: ${error?.message || error}`);
  }
}

export async function uploadToServer(
  file: File,
  walletAddress: string,
  onProgress?: (percent: number) => void
): Promise<ServerUploadResult> {
  if (typeof window === "undefined") {
    throw new Error("Server upload must run in browser environment");
  }

  // Create message to sign (must match server-side verification)
  const message = `I authorize this upload for ${walletAddress}`;
  
  // Sign the message
  const signedMessage = await signMessage(message);
  
  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("walletAddress", walletAddress);
  formData.append("signedMessage", signedMessage);
  formData.append("message", message);
  
  // Send using XMLHttpRequest to report upload progress
  const result: ServerUploadResult = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        try {
          const json = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json);
          } else {
            reject(new Error(json.error || `Server upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        } catch (e: any) {
          reject(new Error(`Invalid server response: ${e?.message || e}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });

  return result;
}

export async function getWalletAddress(): Promise<string> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available");
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return address;
  } catch (error: any) {
    throw new Error(`Failed to get wallet address: ${error?.message || error}`);
  }
}