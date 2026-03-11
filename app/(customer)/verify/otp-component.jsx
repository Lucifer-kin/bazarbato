"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// custom hook to handle countdown
import useCountdown from "@/app/hooks/useCountdown";

import styles from "./page.module.css";
import formStyles from "@/public/styles/form.module.css";
import otpImage from "@/public/images/verify-otp.png";

const INITIAL_OTP = new Array(6).fill("");

export default function OTP_Component({ email, resendOtp, verifyOTP }) {
  const router = useRouter();
  const inputRef = useRef([]);
  const [error, setError] = useState("");
  // value of each input field
  const [otp, setOtp] = useState(INITIAL_OTP);
  // show loading spinner/text while submitting otp
  const [submitting, setSubmitting] = useState(false);
  // show loading spinner/text while resending otp
  const [sendingOtp, setSendingOtp] = useState(false);
  const { countdown, isActive, startCountdown, resetCountdown } =
    useCountdown(1);

  useEffect(() => {
    inputRef.current[0].focus();
  }, []);

  useEffect(() => {
    // created a function because useEffect payload function cannot be async
    // If I create function outside of useEffect, it will cause circular dependency
    async function submitOtp(otpString) {
      setSubmitting(true);
      try {
        const response = await verifyOTP({ otp: otpString });
        if (response.error) {
          return setError(response.error);
        }
        // if response is ok, redirect to home page
        // cookies are already set by verifyOTP function
        router.push("/me");
      } catch (error) {
        setError("Something went wrong. Please reload the page and try again.");
      } finally {
        setSubmitting(false);
        setOtp(INITIAL_OTP);
      }
    }
    const otpString = otp.join("");
    if (otpString.length === 6) {
      submitOtp(otpString);
    }
  }, [otp, setSubmitting, setOtp, setError, router, verifyOTP]);

  const inputChangeHandler = (val = "", index) => {
    if (isNaN(val)) {
      return;
    }
    setOtp((prevOtp) => {
      const newOtp = [...prevOtp];
      newOtp[index] = val.slice(-1);
      return newOtp;
    });
    if (val && inputRef.current[index + 1]) {
      inputRef.current[index + 1].focus();
    }
  };

  const inputClickHandler = (e, index) => {
    if (index > 0 && !otp[index - 1]) {
      inputRef.current[otp.indexOf("")].focus();
    }
  };

  const keyDownHandler = (e, index) => {
    if (e.key === "ArrowRight" && inputRef.current[index + 1]) {
      inputRef.current[index + 1].focus();
    }

    if (e.key === "ArrowLeft" && inputRef.current[index - 1]) {
      e.preventDefault();
      inputRef.current[index - 1].focus();
    }

    if (e.key === "Backspace" && !otp[index] && inputRef.current[index - 1]) {
      inputRef.current[index - 1].focus();
    }
  };

  // handle countdown
  let showCountdown = isActive;
  if (countdown === "00:00") {
    resetCountdown();
    showCountdown = false;
  }
  // handle resend otp click
  const handleResendOtp = async () => {
    if (!showCountdown) {
      try {
        setSendingOtp(true);
        const response = await resendOtp();
        if (response.error) {
          setError(response.error);
        } else {
          startCountdown();
        }
      } catch (error) {
        setError("Something went wrong. Please reload the page and try again.");
      } finally {
        setSendingOtp(false);
      }
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.imgWrapper}>
        <Image src={otpImage} alt="otp verification" width={180} height={140} />
      </div>
      <h1 className={styles.title}>
        {submitting ? "Verifying Otp" : "OTP Verification"}
      </h1>
      {submitting ? (
        <h1 className={styles.loadingText}>Loading...</h1>
      ) : (
        <>
          <p className={styles.text}>Enter otp code sent to {email}</p>
          {error && <p className={`${styles.text} ${styles.error}`}>{error}</p>}
          <div className={styles.inputWrapper}>
            {otp.map((val, index) => (
              <input
                key={index}
                type="number"
                className={[styles.input, formStyles.input].join(" ")}
                value={val}
                onClick={(e) => inputClickHandler(e, index)}
                onKeyDown={(e) => keyDownHandler(e, index)}
                onChange={(e) => inputChangeHandler(e.target.value, index)}
                ref={(ref) => (inputRef.current[index] = ref)}
              />
            ))}
          </div>
          <p className={styles.text}>Didn&apos;t receive OTP code?</p>

          {sendingOtp ? (
            <button variant="text" className={styles.btn}>
              Sending OTP...
            </button>
          ) : (
            <button
              variant="text"
              className={styles.btn}
              onClick={handleResendOtp}
            >
              {showCountdown
                ? `OTP sent, Resend in ${countdown}`
                : "Resend Code"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
