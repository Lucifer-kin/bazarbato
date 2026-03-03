import Link from "next/link";
import { Fragment } from "react";

// react icons
import { FaLayerGroup } from "react-icons/fa";
import { IoBagHandle, IoHeartSharp } from "react-icons/io5";

// components
import UserDetails from "./user-details";
import Path from "@/components/_customer/Path/Path";

// styles sheets
import styles from "./page.module.css";
import { getUser, logoutUser } from "@/helpers/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Profile | Bazaar Bato",
};

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect("/");
    return <></>;
  }
  return (
    <Fragment>
      <Path paths={[{ name: "Home", href: "/" }, { name: "Profile" }]} />
      <section className={styles.links}>
        <div className={styles.header}>
          <h1 className={styles.title}>Links</h1>
          <Link href="/orders" className={styles.link}>
            <FaLayerGroup />
            My orders
          </Link>
          <Link href="/wishlist" className={styles.link}>
            <IoHeartSharp />
            Wishlist
          </Link>
          <Link href="/bag" className={styles.link}>
            <IoBagHandle />
            My bag
          </Link>
        </div>
      </section>
      <UserDetails logout={logoutUser} />
    </Fragment>
  );
}
