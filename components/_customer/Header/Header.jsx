"use client";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

import {
  IoPersonOutline,
  IoHeartOutline,
  IoBagHandleOutline,
  IoSearchOutline,
} from "react-icons/io5";

import logo from "@/public/images/logo.png";
import logoIcon from "@/public/images/icon.png";

import styles from "./Header.module.css";

export default function Header() {
  const user = useSelector((state) => state.user.user);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.query.value;
    if (query) {
      router.push(`/search?query=${query}`);
    }
  };

  return (
    <header className={styles.header}>
      <Link href="/">
        <Image
          className={styles.logo}
          src={logo}
          alt="Bazar bato"
          width={150}
          height={50}
        />
        <Image
          className={styles.logoIcon}
          src={logoIcon}
          alt="Bazar bato"
          width={45}
        />
      </Link>
      <form className={styles.search_container} onSubmit={handleSearch}>
        <input
          type="text"
          name="query"
          placeholder="Enter your product name..."
          className={styles.search}
        />
        <button className={styles.search_btn}>
          <IoSearchOutline />
        </button>
      </form>

      <div className={styles.icons}>
        <Link href={`/${user ? "me" : "login"}`}>
          {user ? (
            <Image
              className={styles.avatar}
              // src={user.avatar}
              src={user?.avatar}
              alt={user?.firstName}
              width={35}
              height={35}
            />
          ) : (
            <IoPersonOutline className={styles.icon} />
          )}
        </Link>
        <Link href="wishlist">
          <span className={styles.cart_count}>0</span>
          <IoHeartOutline className={styles.icon} />
        </Link>
        <Link href="/bag">
          {/* <span className={styles.cart_count}>0</span> */}
          <IoBagHandleOutline className={styles.icon} />
        </Link>
      </div>
    </header>
  );
}
