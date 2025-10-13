import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { verifyMessage } from "ethers";
import { NextRequest, NextResponse } from "next/server";

// Ensure Node.js runtime for S3 and Buffer usage
export const runtime = "nodejs";

// Filebase S3 client
const s3Config = {
  region: process.env.FILEBASE_REGION || "us-east-1",
  endpoint: process.env.FILEBASE_ENDPOINT || "https://s3.filebase.com",
  credentials: {
    accessKeyId: process.env.FILEBASE_S3_KEY || "",
    secretAccessKey: process.env.FILEBASE_S3_SECRET || "",
  },
  forcePathStyle: false,
};

const s3 = process.env.FILEBASE_S3_KEY && process.env.FILEBASE_S3_SECRET
  ? new S3Client(s3Config)
  : null;

export async function POST(req: NextRequest) {
  try {
    if (!s3) {
      return NextResponse.json(
        { success: false, error: "Filebase S3 not configured" },
        { status: 500 }
      );
    }

    if (!process.env.FILEBASE_BUCKET) {
      return NextResponse.json(
        { success: false, error: "FILEBASE_BUCKET not set" },
        { status: 500 }
      );
    }

    // Parse multipart/form-data from the request
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const walletAddress = form.get("walletAddress")?.toString();
    const signedMessage = form.get("signedMessage")?.toString();
    const providedMessage = form.get("message")?.toString() || null;

    if (!file || !walletAddress || !signedMessage) {
      return NextResponse.json(
        { success: false, error: "Missing file, walletAddress, or signedMessage" },
        { status: 400 }
      );
    }

    // Verify signature
    // Client must sign the exact message. If no message is provided, we use a deterministic one.
    const message = providedMessage || `I authorize this upload for ${walletAddress}`;
    let recovered: string;
    try {
      recovered = verifyMessage(message, signedMessage);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Signature could not be verified" },
        { status: 401 }
      );
    }

    if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Signature does not match walletAddress" },
        { status: 401 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = (file as any).name || "upload";
    const contentType = (file as any).type || "application/octet-stream";

    // Choose an object key
    const key = `${walletAddress}/${Date.now()}-${originalName}`;

    // Upload to Filebase S3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.FILEBASE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        uploadedBy: walletAddress,
        originalName: originalName,
      },
    }));

    // Retrieve IPFS CID via HEAD (Filebase exposes CID via metadata)
    const head = await s3.send(new HeadObjectCommand({
      Bucket: process.env.FILEBASE_BUCKET,
      Key: key,
    }));

    const metadata = head.Metadata || {};
    const cid = metadata["cid"] || metadata["ipfs-cid"] || metadata["ipfs_hash"] || metadata["x-amz-meta-cid"] || null;

    if (!cid) {
      // If CID isn't present, return an error since the contract expects CID on success
      return NextResponse.json(
        { success: false, error: "CID not returned by Filebase for uploaded object" },
        { status: 502 }
      );
    }


    return NextResponse.json({ success: true, CID: cid });
  } catch (err: any) {
    console.error("/api/upload error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
