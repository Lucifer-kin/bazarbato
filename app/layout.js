import { Inter } from "next/font/google";
import UserContextProvider from "./store/UserContextProvider";
import { getUser, setUser } from "@/helpers/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bazar Bato",
};

export default async function RootLayout({ children }) {
  const user = await getUser();
  await setUser(user);
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{ position: "relative" }} id="overlay" />
        <UserContextProvider user={user}>{children}</UserContextProvider>
      </body>
    </html>
  );
}
