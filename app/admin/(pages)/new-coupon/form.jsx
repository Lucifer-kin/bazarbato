"use client";

import { Fragment, useEffect, useReducer, useState } from "react";
import styles from "./page.module.css";
import formStyles from "@/public/styles/form.module.css";

import AdminPageHeading from "@/components/Utils/AdminPageHeading";
import Card from "@/components/Card/Card";
import Toggle from "@/components/Toggle/Toggle";

import CheckBox from "@/components/CheckBox/CheckBox";
import RadioButton from "@/components/RadioButton/RadioButton";
import InputError from "@/components/InputError/InputError";
import Spinner from "@/components/_admin/Spinner/Spinner";
import { useRouter } from "next/navigation";
import Modal from "@/components/_admin/Modal/Modal";
import MultiSelect from "@/components/MultiSelect/MultiSelect";

// NULL ERRORS
const NULL_ERRORS = {
  couponCode: { message: "", touched: false },
  description: { message: "", touched: false },
  discountValue: { message: "", touched: false },
  maxDiscountAmount: { message: "", touched: false },
};

// VALIDATION ERRORS
const VALIDATION_ERRORS = Object.freeze({
  couponCode: {
    message: "Coupon code is required",
    touched: false,
  },
  description: {
    message: "Description should be 6 characters long",
    touched: false,
  },
  discountValue: {
    message: "Discount value must be greater than 0",
    touched: false,
  },
  maxDiscountAmount: {
    message: "",
    touched: false,
  },
});

// reducer function for input validation
function reducer(state, action) {
  const payload = action.payload;
  const error = { message: "", touched: true };
  // switch case to check the type of action
  switch (action.type) {
    case "COUPON_CODE":
      error.message = payload;
      return { ...state, couponCode: error };

    case "DESCRIPTION":
      error.message =
        payload.length < 6 ? VALIDATION_ERRORS.description.message : "";
      return { ...state, description: error };

    case "DISCOUNT_AMOUNT":
      error.message =
        payload < 1 ? VALIDATION_ERRORS.discountValue.message : "";
      return { ...state, discountValue: error };

    case "DISCOUNT_PERCENTAGE":
      error.message =
        payload < 1 || payload > 100
          ? "Discount percentage must be between 1 and 100"
          : "";
      return { ...state, discountValue: error };

    case "MAX_DISCOUNT_AMOUNT":
      error.message =
        payload <= 1 ? "Max discount amount must be greater than 0" : "";
      return { ...state, maxDiscountAmount: error };

    case "SET_MAX_DISCOUNT_AMOUNT":
      error.message = "Max discount amount is required";
      error.touched = false;
      return {
        ...state,
        maxDiscountAmount: error,
      };
    case "RESET_MAX_DISCOUNT_AMOUNT":
      return {
        ...state,
        maxDiscountAmount: NULL_ERRORS.maxDiscountAmount,
      };

    case "RESET":
      return { ...VALIDATION_ERRORS };

    case "SET_ERRORS":
      return { ...payload };

    default:
      return { ...state };
  }
}

export default function NewCouponForm({
  addCoupon,
  coupon,
  products,
  categories,
  checkIfCouponExists,
}) {
  const router = useRouter();
  const [errors, dispatch] = useReducer(
    reducer,
    coupon ? NULL_ERRORS : VALIDATION_ERRORS
  );
  const [couponCode, setCouponCode] = useState(coupon?.code || "");
  const [loading, setLoading] = useState(false);
  const [responseError, setResponseError] = useState("");
  const [discountType, setDiscountType] = useState(
    coupon?.discountType || "FIXED"
  );
  const [couponApplyOn, setCouponApplyOn] = useState(
    coupon?.applicableOn || "CATEGORY"
  );
  const [couponScope, setCouponScope] = useState(coupon?.scope || "INDIVIDUAL");

  // useEffect to check if coupon code already exists
  // in a debounced manner
  useEffect(() => {
    if (couponCode.length < 3) return;
    if (couponCode === coupon?.code) return;
    const timerID = setTimeout(async () => {
      try {
        const response = await checkIfCouponExists({ code: couponCode });
        if (response.ack && response.exists) {
          dispatch({
            type: "COUPON_CODE",
            payload: "Coupon Code already exists",
          });
        } else if (response.ack) {
          dispatch({ type: "COUPON_CODE", payload: "" });
        } else {
          dispatch({
            type: "COUPON_CODE",
            payload: response.error,
          });
        }
      } catch {
        dispatch({
          type: "COUPON_CODE",
          payload: "Something went wrong",
        });
      }
    }, 1000);

    return () => clearTimeout(timerID);
  }, [couponCode, coupon, checkIfCouponExists]);

  // function to handle change in coupon code
  const handleCouponCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/\s/g, "");
    setCouponCode(value);
    if (value.length < 3)
      dispatch({
        type: "COUPON_CODE",
        payload: "Coupon Code must be 3 characters long",
      });
    else {
      dispatch({ type: "COUPON_CODE", payload: "" });
    }
  };

  // function to handle form submission
  const formSubmitHandler = async (e) => {
    e.preventDefault();
    // checking if the form is valid and all the fields are filled correctly
    const isFormValid = Object.values(errors).every((error) => !error.message);
    // if the form is not touched, then set the default errors
    // it means that the user has not interacted with the form
    if (isFormValid) {
      // creating a new form data object
      const formData = new FormData(e.target);
      // append the coupon id to the form data
      // if the page is in edit mode then the coupon id will be appended
      formData.append("_id", coupon?._id || "");
      // calling the submit function
      try {
        setLoading(true);
        const response = await addCoupon(formData);
        if (response.error) {
          setResponseError(response.error);
          setLoading(false);
        } else {
          router.push("/admin/coupons");
          setCouponCode("");
          dispatch({ type: "RESET" });
        }
      } catch (error) {
        setLoading(false);
      }
    } else {
      for (const key in errors) {
        errors[key].touched = true;
      }
      dispatch({ type: "SET_ERRORS", payload: errors });
    }
  };

  if (loading) return <Spinner />;

  return (
    <Fragment>
      {responseError && (
        <Modal
          btn1Text="Okay"
          btn2Text="Cancel"
          onOk={() => setResponseError("")}
          onCancel={() => setResponseError("")}
          title="Some Error Occured!!"
          paragraph={responseError}
        />
      )}
      <form
        onSubmit={formSubmitHandler}
        className={`${styles.container} homepadding`}
      >
        <AdminPageHeading back="/admin/coupons">
          Create A New Coupon
        </AdminPageHeading>
        <Card className={styles.card}>
          <span className={styles.cardTitle}>General</span>
          <Fragment key="coupon-code">
            <label htmlFor="new-coupon-code" className={formStyles.label}>
              Coupon code
            </label>
            <input
              id="new-coupon-code"
              className={formStyles.input}
              type="text"
              name="code"
              placeholder="Enter coupon code"
              value={couponCode}
              disabled={coupon?._id}
              onChange={handleCouponCodeChange}
            />
            <InputError errors={errors} name="couponCode" />
          </Fragment>

          <Fragment key="description">
            <label
              htmlFor="new-coupon-description"
              className={formStyles.label}
            >
              Description
            </label>
            <textarea
              id="new-coupon-description"
              className={formStyles.textarea}
              type="text"
              name="description"
              placeholder="Enter description"
              defaultValue={coupon?.description || ""}
              onChange={(e) =>
                dispatch({ type: "DESCRIPTION", payload: e.target.value })
              }
            />
            <InputError errors={errors} name="description" />
          </Fragment>

          <label htmlFor="new-coupon-status" className={formStyles.label}>
            Status
          </label>
          <Toggle
            defaultChecked={coupon ? coupon?.isActive : true}
            id="new-coupon-status"
            className={styles.statusToggle}
            name="status"
            value="true"
          />

          <div className={styles.amount_and_date}>
            <div>
              <label
                htmlFor="new-coupon-max-use-limit"
                className={formStyles.label}
              >
                Maximum Use Limit
              </label>
              <input
                id="new-coupon-max-use-limit"
                className={`${formStyles.input} ${styles.max_discount_amount}`}
                type="number"
                name="use-limit"
                defaultValue={coupon?.usageLimit || 1}
                min={1}
                placeholder="Max Use Limit"
              />
            </div>
            <div>
              <label
                htmlFor="new-coupon-start-date"
                className={formStyles.label}
              >
                Start date
              </label>
              <input
                id="new-coupon-start-date"
                className={`${formStyles.input} ${formStyles.date}`}
                type="date"
                name="start-date"
                min={new Date().toISOString().split("T")[0]}
                defaultValue={
                  new Date(coupon?.validFrom || Date.now())
                    .toISOString()
                    .split("T")[0]
                }
              />
            </div>
            <div>
              <label htmlFor="new-coupon-end-date" className={formStyles.label}>
                End date
              </label>
              <input
                id="new-coupon-end-date"
                className={`${formStyles.input} ${formStyles.date}`}
                type="date"
                name="end-date"
                min={new Date().toISOString().split("T")[0]}
                defaultValue={
                  new Date(coupon?.validUntil || Date.now())
                    .toISOString()
                    .split("T")[0]
                }
              />
            </div>
          </div>
          <CheckBox
            defaultChecked={coupon?.freeShipping}
            id="new-coupon-free-shipping"
            styles={{ fontSize: "0.9rem" }}
            name="free-shipping"
          >
            Free shipping?
          </CheckBox>
          <br />
          <CheckBox
            defaultChecked={coupon?.forNewCustomers}
            id="new-coupon-for-new-customer"
            styles={{ fontSize: "0.9rem" }}
            name="new-customers"
          >
            For new customer only?
          </CheckBox>
        </Card>

        <Card className={styles.discountCard}>
          <Fragment key="type--fixed-or-percentage">
            <span
              className={styles.cardTitle}
              style={{ margin: "1rem 0 0.5rem" }}
            >
              Discount Type
            </span>
            <div className="flex">
              <RadioButton
                name="type"
                value="FIXED"
                disabled={coupon}
                checked={discountType === "FIXED"}
                className={[styles.discountTypeOption, "mr-1"].join(" ")}
                onChange={() => {
                  setDiscountType("FIXED");
                  dispatch({ type: "RESET_MAX_DISCOUNT_AMOUNT" });
                }}
              >
                Fixed
              </RadioButton>
              <RadioButton
                className={styles.discountTypeOption}
                name="type"
                value="PERCENTAGE"
                disabled={coupon}
                checked={discountType === "PERCENTAGE"}
                onChange={() => {
                  setDiscountType("PERCENTAGE");
                  dispatch({ type: "SET_MAX_DISCOUNT_AMOUNT" });
                }}
              >
                Percentage
              </RadioButton>
            </div>
          </Fragment>

          <Fragment key="apply-on">
            <span
              className={styles.cardTitle}
              style={{ margin: "1rem 0 0.5rem" }}
            >
              Applicable on
            </span>
            <div className="flex">
              <RadioButton
                className={[styles.discountTypeOption, "mr-1"].join(" ")}
                name="apply-on"
                value="CATEGORY"
                checked={couponApplyOn === "CATEGORY"}
                onChange={() => setCouponApplyOn("CATEGORY")}
              >
                Categories
              </RadioButton>
              <RadioButton
                className={styles.discountTypeOption}
                name="apply-on"
                value="PRODUCT"
                checked={couponApplyOn === "PRODUCT"}
                onChange={() => setCouponApplyOn("PRODUCT")}
              >
                Products
              </RadioButton>
            </div>
          </Fragment>

          <Fragment key="coupon-scope">
            <span
              className={styles.cardTitle}
              style={{ margin: "1rem 0 0.5rem" }}
            >
              Coupon Scope
            </span>
            <div className="flex">
              <RadioButton
                className={[styles.discountTypeOption, "mr-1"].join(" ")}
                name="scope"
                value="INDIVIDUAL"
                checked={couponScope === "INDIVIDUAL"}
                onChange={() => setCouponScope("INDIVIDUAL")}
              >
                Individual
              </RadioButton>
              <RadioButton
                className={styles.discountTypeOption}
                name="scope"
                value="ENTIRE_ORDER"
                checked={couponScope === "ENTIRE_ORDER"}
                onChange={() => setCouponScope("ENTIRE_ORDER")}
              >
                Entire Order
              </RadioButton>
            </div>
          </Fragment>

          <Fragment key="discount-value amount-or-percentage">
            <label className={`${formStyles.label} ${styles.discountValue}`}>
              Discount {discountType === "FIXED" ? "Amount" : "Percent (%)"}
            </label>
            <input
              className={formStyles.input}
              min={0}
              step={0.01}
              type="number"
              name="discount-value"
              disabled={coupon}
              defaultValue={coupon?.discountValue}
              onChange={(e) =>
                dispatch({
                  type:
                    discountType === "FIXED"
                      ? "DISCOUNT_AMOUNT"
                      : "DISCOUNT_PERCENTAGE",
                  payload: e.target.value,
                })
              }
              placeholder={`Enter discount ${
                discountType === "FIXED" ? "amount" : "percentage"
              }`}
            />
            <InputError errors={errors} name="discountValue" />
          </Fragment>

          {discountType === "PERCENTAGE" && (
            <Fragment>
              <label className={`${formStyles.label} ${styles.discountValue}`}>
                Maximum Discount Amount
              </label>
              <input
                min={1}
                type="number"
                disabled={coupon}
                name="max-discount-amount"
                id="new-coupon-max-amount"
                placeholder="Max discount amount"
                className={`${formStyles.input} ${styles.max_discount_amount}`}
                defaultValue={coupon?.maxDiscountAmount}
                onChange={(e) =>
                  dispatch({
                    type: "MAX_DISCOUNT_AMOUNT",
                    payload: e.target.value,
                  })
                }
              />
              <InputError errors={errors} name="maxDiscountAmount" />
            </Fragment>
          )}

          {couponScope === "INDIVIDUAL" && (
            <Fragment key="select categories or products">
              <label className={`${formStyles.label} ${styles.discountValue}`}>
                Select{" "}
                {couponApplyOn === "CATEGORY" ? "Categories" : "Products"}
              </label>
              <MultiSelect
                key={couponApplyOn}
                capsules={
                  coupon?.applicableOn === "CATEGORY"
                    ? coupon?.applicableCategories
                    : coupon?.applicableProducts
                }
                name="applicable-items"
                className={styles.multiSelect}
                options={couponApplyOn === "CATEGORY" ? categories : products}
              />
            </Fragment>
          )}
        </Card>

        <Card className={styles.card}>
          <span className={styles.cardTitle}>Order Conditions</span>
          <label className={formStyles.label}>Minimum order amount (Rs)</label>
          <input
            className={formStyles.input}
            type="number"
            name="min-order-amount"
            placeholder="Enter amount"
            step={0.01}
            min={0}
            defaultValue={coupon?.minPurchaseAmount || 0}
          />
          <label className={formStyles.label}>Minimum order quantity</label>
          <input
            className={formStyles.input}
            type="number"
            name="min-order-quantity"
            placeholder="Enter quantity"
            min={0}
            defaultValue={coupon?.minPurchaseQuantity || 0}
          />
        </Card>

        <Card className={`${styles.footer} ${styles.card}`}>
          <button className={styles.saveButton} type="submit">
            {coupon ? "Update" : "Save"}
          </button>
          <button className={styles.cancelButton} type="reset">
            Reset
          </button>
        </Card>
      </form>
    </Fragment>
  );
}
