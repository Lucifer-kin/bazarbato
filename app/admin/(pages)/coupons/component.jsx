"use client";

// core react packages
import Link from "next/link";
import { useState } from "react";

// css files
import styles from "./page.module.css";
import formStyles from "@/public/styles/form.module.css";

// custom components
import Card from "@/components/Card/Card";
import Modal from "@/components/_admin/Modal/Modal";
import CheckBox from "@/components/CheckBox/CheckBox";
import TableFoot from "@/components/_admin/TableFoot/TableFoot";

// redux
import { useDispatch } from "react-redux";
import { resetError, setError } from "@/app/reducers/utils";

// helper functions
import { formatDate } from "@/helpers/utils";

export default function CouponClientComponent({
  coupons: propCoupons,
  deleteCoupons,
  disableCoupons,
  couponsCount,
}) {
  const [selectedCoupons, setSelectedCoupon] = useState([]);
  const dispatch = useDispatch();
  const [modalType, setModalType] = useState("");
  const [coupons, setCoupons] = useState(propCoupons);

  const couponSelectHandler = (e) => {
    const { value } = e.target;
    if (selectedCoupons.includes(value)) {
      setSelectedCoupon((prev) => prev.filter((item) => item !== value));
    } else {
      setSelectedCoupon((prev) => [...prev, value]);
    }
  };

  const couponDeleteHandler = async () => {
    dispatch(resetError());
    try {
      const response = await deleteCoupons(selectedCoupons);
      console.log(response.error);
      if (response.error) {
        dispatch(setError(response.error));
      } else {
        dispatch(
          setError({
            title: "Success",
            message: "Coupons deleted successfully",
            status: true,
          })
        );
        setCoupons((prev) =>
          prev.filter((coupon) => !selectedCoupons.includes(coupon._id))
        );
        setSelectedCoupon([]);
      }
    } catch (error) {
      dispatch(setError("Server Error, Something went wrong"));
    } finally {
      setModalType("");
    }
  };

  const couponDisableHandler = async () => {
    dispatch(resetError());
    try {
      const response = await disableCoupons(selectedCoupons);
      console.log(response.error);
      if (response.error) {
        dispatch(setError(response.error));
      } else {
        dispatch(
          setError({
            title: "Success",
            message: "Coupons disabled successfully",
            status: true,
          })
        );
        setCoupons((prev) =>
          prev.map((coupon) => {
            if (selectedCoupons.includes(coupon._id)) {
              return { ...coupon, isActive: false };
            }
            return coupon;
          })
        );
        setSelectedCoupon([]);
      }
    } catch (error) {
      dispatch(setError("Server Error, Something went wrong"));
    } finally {
      setModalType("");
    }
  };

  const modalTitleKey = modalType === "disable" ? "Disable" : "Delete";
  const modalPargraphKey = modalType === "disable" ? "disable" : "delete";
  const btn1Text = modalType === "disable" ? "Disable" : "Delete";

  return (
    <div className={styles.container}>
      {modalType && (
        <Modal
          btn1Text={btn1Text}
          btn2Text="Cancel"
          bgColor2={modalType === "disable" ? "#2c6ecb" : "#d72c0d"}
          onCancel={() => setModalType("")}
          onOk={
            modalType === "disable" ? couponDisableHandler : couponDeleteHandler
          }
          title={`${modalTitleKey} ${selectedCoupons.length} coupons`}
          paragraph={`Are you sure you want to ${modalPargraphKey} this coupon?`}
        />
      )}

      <div className={styles.title}>
        <h1>Coupons</h1>
        <Link className={styles.newCouponLink} href="/admin/new-coupon">
          New Coupon
        </Link>
      </div>
      <Card className={styles.card}>
        <input
          type="text"
          placeholder="Search"
          className={`${formStyles.input} ${styles.search}`}
        />
        <select className={`${formStyles.select}`}>
          <option value="all">All</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
        <select className={`${formStyles.select} ${styles.sort}`}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="nameAsc">Name: A to Z</option>
          <option value="nameDesc">Name: Z to A</option>
          <option value="priceAsc">Free shipping enabled</option>
        </select>

        {selectedCoupons.length > 0 && (
          <div className={styles.controls}>
            <div className={styles.no_of_selected_product}>
              {selectedCoupons.length} selected
            </div>
            <div
              className={styles.delete_btn}
              onClick={() => setModalType("delete")}
            >
              Delete
            </div>
            <div
              className={styles.enable_or_disable_btn}
              onClick={() => setModalType("disable")}
            >
              Disable
            </div>
          </div>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkbox}></th>
              <th className={styles.code}>Coupon Code</th>
              <th className={styles.startdate}>Start Date</th>
              <th className={styles.enddate}>End date</th>
              <th className={styles.usedtimes}>Used times</th>
              <th className={styles.status}>Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons?.length > 0 &&
              coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td className={styles.checkbox}>
                    <CheckBox
                      id={coupon._id}
                      value={coupon._id}
                      checked={selectedCoupons.includes(coupon._id)}
                      onClick={couponSelectHandler}
                    />
                  </td>
                  <td className={styles.code}>
                    <Link href={`/admin/coupons/${coupon?.code}`}>
                      {coupon?.code}
                    </Link>
                  </td>
                  <td className={styles.startdate}>
                    {formatDate(coupon?.validFrom)}
                  </td>
                  <td className={styles.enddate}>
                    {formatDate(coupon?.validUntil)}
                  </td>
                  <td className={styles.usedtimes}>{coupon?.usageCount}</td>
                  <td className={styles.status}>
                    <span className={coupon?.isActive ? "" : styles.disabled} />
                  </td>
                </tr>
              ))}
          </tbody>

          <TableFoot total={couponsCount} />
        </table>
      </Card>
    </div>
  );
}
