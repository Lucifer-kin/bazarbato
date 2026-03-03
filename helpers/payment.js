// core modules
import Order from "@/models/Order";
// import crypto from "crypto";

// this function will create a signature from a string


export async function markOrderAsPaid(orderId) {
  try {
    await dbConnect();
    await Order.findByIdAndUpdate(orderId, { paymentStatus: "PAID" });
    return true;
  } catch {
    return false;
  }
}
