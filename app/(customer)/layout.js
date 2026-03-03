// custom components
import Nav from "@/components/_customer/Nav/Nav";
import Footer from "@/components/_customer/Footer/Footer";
import Header from "@/components/_customer/Header/Header";

// styles
import "./global.css";

import { Fragment } from "react";

export const metadata = {
  title: "Home | Bazar Bato",
};

export default async function RootLayout({ children }) {
  return (
    <Fragment>
      <Header />
      <Nav />
      <main>{children}</main>
      <Footer />
    </Fragment>
  );
}
