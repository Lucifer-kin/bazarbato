// core modules
import Order from "@/models/Order";
import crypto from "crypto";

// this function will create a signature from a string
export function createSignatureForEsewaPayment(data) {
  const secret = "8gBm/:&EnhH.1/q";
  const hash = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64");
  return hash;
}

export function decodeEsewaPaymentSuccessToken(token) {
  if (!token) {
    return null;
  }
  const decodedToken = JSON.parse(Buffer.from(token, "base64").toString());
  const dataString = decodedToken.signed_field_names
    .split(",")
    .map((field) => `${field}=${decodedToken[field]}`)
    .join(",");
  const signature = createSignatureForEsewaPayment(dataString);

  if (signature === decodedToken.signature) {
    return decodedToken;
  } else {
    return null;
  }
}


export async function markOrderAsPaid(orderId) {
  try {
    await dbConnect();
    await Order.findByIdAndUpdate(orderId, { paymentStatus: "PAID" });
    return true;
  } catch {
    return false;
  }
}
