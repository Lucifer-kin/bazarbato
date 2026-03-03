"use client";
import { removeOrder } from "@/app/reducers/order";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function PaymentSuccessPage({
  data: paymentResponseData,
  order,
}) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(removeOrder());
  }, [dispatch]);

  return (
    <div>
      <h1>Payment Success</h1>
      <p>Your payment has been successfully processed.</p>
      <br />
      {/* <p>{paymentResponseData} </p> */}
      <Link href={`/order/${order._id}`}>View my order</Link>
    </div>
  );
}
