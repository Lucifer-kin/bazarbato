"use client";

import { Provider } from "react-redux";

import Modal from "@/components/_customer/Modal/Modal";
import store from "./store";

export default function UserContextProvider({ children, user }) {
  console.log("Inserting user into the store:");
  store.dispatch({ type: "user/setUser", payload: user });

  return (
    <Provider store={store}>
      <Modal />
      {children}
    </Provider>
  );
}
