import crypto from "crypto";
import { addMonths } from "@/lib/time-utils";

export type DingerCheckoutPlan = "pro" | "growth" | "verified";

type DingerCheckoutInput = {
  clientId: string;
  publicKey: string;
  merchantKey: string;
  projectName: string;
  merchantName: string;
  customerName: string;
  totalAmount: number;
  merchantOrderId: string;
  items: Array<{
    name: string;
    amount: number;
    quantity: number;
  }>;
  production?: boolean;
};

type DingerPaymentResult = {
  merchantOrderId?: string;
  transactionStatus?: string;
  transactionId?: string;
  createdAt?: string;
  totalAmount?: number;
  providerName?: string;
  methodName?: string;
  customerName?: string;
  [key: string]: unknown;
};

const PREBUILT_STAGING_URL = "https://prebuilt.dinger.asia";
const PREBUILT_PRODUCTION_URL = "https://form.dinger.asia";

function getRsaPublicKeyPem(publicKey: string) {
  if (publicKey.includes("BEGIN PUBLIC KEY")) {
    return publicKey;
  }

  const wrapped = publicKey.match(/.{1,64}/g)?.join("\n") ?? publicKey;
  return `-----BEGIN PUBLIC KEY-----\n${wrapped}\n-----END PUBLIC KEY-----`;
}

function chunkStringForDinger(value: string, chunkSize = 64) {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += chunkSize) {
    chunks.push(value.slice(index, index + chunkSize));
  }
  return chunks;
}

function encryptPayloadWithRsa(jsonPayload: string, publicKey: string) {
  const key = getRsaPublicKeyPem(publicKey);
  const buffers = chunkStringForDinger(jsonPayload).map((chunk) =>
    crypto.publicEncrypt(
      {
        key,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(chunk, "utf8")
    )
  );

  return Buffer.concat(buffers).toString("base64");
}

function createHashValue(jsonPayload: string, merchantKey: string) {
  return crypto.createHmac("sha256", merchantKey).update(jsonPayload, "utf8").digest("hex");
}

export function createDingerPrebuiltCheckoutUrl(input: DingerCheckoutInput) {
  const payloadObject = {
    clientId: input.clientId,
    publicKey: input.publicKey,
    items: JSON.stringify(input.items),
    customerName: input.customerName,
    totalAmount: input.totalAmount,
    merchantOrderId: input.merchantOrderId,
    merchantKey: input.merchantKey,
    projectName: input.projectName,
    merchantName: input.merchantName,
  };

  const jsonPayload = JSON.stringify(payloadObject);
  const encryptedPayload = encryptPayloadWithRsa(jsonPayload, input.publicKey);
  const hashValue = createHashValue(jsonPayload, input.merchantKey);
  const baseUrl = input.production ? PREBUILT_PRODUCTION_URL : PREBUILT_STAGING_URL;

  return `${baseUrl}/?payload=${encodeURIComponent(encryptedPayload)}&hashValue=${hashValue}`;
}

export function decryptDingerPaymentResult(paymentResult: string, callbackSecretKey: string) {
  const decipher = crypto.createDecipheriv("aes-256-ecb", Buffer.from(callbackSecretKey, "utf8"), null);
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(paymentResult, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return decrypted;
}

export function validateDingerCallbackChecksum(decryptedPayload: string, checksum: string) {
  const calculated = crypto.createHash("sha256").update(decryptedPayload, "utf8").digest("hex");
  return calculated === checksum.toLowerCase();
}

export function mapDingerStatusToInternal(status: string | undefined) {
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "SUCCESS") return "paid" as const;
  if (
    normalized === "FAIL" ||
    normalized === "FAILED" ||
    normalized === "ERROR" ||
    normalized === "TIMEOUT" ||
    normalized === "DECLINED" ||
    normalized === "SYSTEM_ERROR"
  ) {
    return "failed" as const;
  }
  if (normalized === "CANCEL" || normalized === "CANCELLED") return "canceled" as const;
  return "pending" as const;
}

export function getDingerBillingDates(now = new Date()) {
  const paidAt = now.toISOString();
  const nextBillingAt = addMonths(now, 1).toISOString();
  return {
    paidAt,
    subscriptionStartedAt: paidAt,
    nextBillingAt,
    subscriptionEndsAt: nextBillingAt,
  };
}

export function parseDingerPaymentResult(json: string): DingerPaymentResult {
  return JSON.parse(json) as DingerPaymentResult;
}
