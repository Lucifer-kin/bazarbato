"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

// reducer actions
import { addOrder } from "@/app/reducers/order";

// react icons
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { FaStar, FaStarHalf } from "react-icons/fa";
import { MdLabelImportant } from "react-icons/md";
import { BsBagPlusFill } from "react-icons/bs";
import { ImSpinner9 } from "react-icons/im";
import { IoWalletSharp } from "react-icons/io5";
import { LiaTimesCircleSolid } from "react-icons/lia";

import styles from "./page.module.css";
import Quantity from "@/components/_customer/Quantity/Quantity";
import Path from "@/components/_customer/Path/Path";
import { resetError, setError } from "@/app/reducers/utils";

// function to get the active attribute initially when the page loads
// it is a pure function
const getInitialState = (attributes) => {
  const initialState = {};
  attributes.forEach((attribute) => {
    initialState[attribute.name] = attribute.values[0];
  });
  return initialState;
};

// PageComponent function
export default function PageComponent({ product, addToBag, applyCoupon }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [selectedAttribute, setSelectedAttribute] = useState(
    getInitialState(product.attributes),
  );
  const [price, setPrice] = useState(product.price);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(false);

  // function to slide image to left when left arrow is clicked
  const leftArrowClickHandler = () => {
    const images = product.images;
    const index = images.indexOf(activeImage);
    setActiveImage(images[(images.length + index - 1) % images.length]);
  };

  // function to slide image to right when right arrow is clicked
  const rightArrowClickHandler = () => {
    const images = product.images;
    const index = images.indexOf(activeImage);
    setActiveImage(images[(index + 1) % images.length]);
  };

  // function to add product to bag
  const addToBagHandler = async () => {
    if (loading) return;
    dispatch(resetError());

    if (!user) {
      dispatch(setError("Please login to add this item to bag."));
      return;
    }
    const selectedProduct = {
      _id: product._id,
      sku: product.sku,
      coupon: coupon,
      quantity: quantity,
      attributes: selectedAttribute,
    };
    try {
      setLoading(true);
      const response = await addToBag(selectedProduct);
      if (response?.error) {
        dispatch(setError(response.error));
        return;
      } else {
        dispatch(
          setError({
            message: "Product added to bag.",
            title: "Success",
            status: true,
          }),
        );
      }
    } catch (error) {
      dispatch(setError("Something went wrong. Please try again later."));
    } finally {
      setLoading(false);
    }
  };

  // function to apply coupon
  const applyCouponHandler = async (e) => {
    e.preventDefault();
    const couponCode = e.target.couponCode.value.toUpperCase();
    if (!couponCode) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setCouponError("");
    setCoupon("loading");
    // apply coupon logic
    try {
      const { error, discountAmount } = await applyCoupon(couponCode, {
        _id: product._id,
        price: price,
        quantity: quantity,
      });
      if (error) {
        setCouponError(error);
        setCoupon("");
        return;
      }
      setCoupon(couponCode);
      setPrice(product.price - discountAmount);
      setDiscount(discountAmount);
    } catch {
      setCouponError("Something went wrong. Please try again later.");
      setCoupon("");
    }
  };

  // function to remove coupon
  const couponRemoveHandler = () => {
    setCoupon("");
    setPrice(product.price);
    setDiscount(0);
  };

  // buy now button click handler
  const buyNowHandler = () => {
    dispatch(resetError());
    if (!user) {
      dispatch(setError("Please login to order this item."));
      return;
    }
    const order = {
      user: user._id,
      items: [
        {
          product: product._id,
          name: product.name,
          sku: product.sku,
          image: product.images[0],
          url_key: product.url_key,
          price: product.price,
          category: product.category._id,
          quantity: quantity,
          coupon: coupon,
          discountAmount: discount,
          total: price * quantity,
        },
      ],
      totalItems: quantity,
      total: price * quantity,
      coupon: null,
      discountAmount: 0,
      shipping: null,
      grossTotal: price * quantity,
    };
    dispatch(addOrder(order));
    setCoupon("");
    setPrice(product.price);
    setDiscount(0);
    router.push("/shipping");
  };

  return (
    <section className={styles.section}>
      <div className={styles.productContent}>
        <Path
          paths={[
            { name: "New Arrival", href: "#" },
            {
              name: product.category.name,
              href: `/category/${product.category.url_key}`,
            },
            { name: product.name, href: "#" },
          ]}
        />
        <div className={styles.images}>
          <div className={styles.mainImage}>
            <Image src={activeImage} alt="jacket" width={400} height={400} />
            <div className={styles.leftArrow}>
              <IoIosArrowBack onClick={leftArrowClickHandler} />
            </div>
            <div className={styles.rightArrow}>
              <IoIosArrowForward onClick={rightArrowClickHandler} />
            </div>
          </div>
          {product?.images.map((image, index) => (
            <Image
              key={index}
              src={image}
              alt={product.name}
              width={400}
              height={400}
              draggable={false}
              onClick={() => setActiveImage(image)}
            />
          ))}
        </div>
        <div className={styles.details}>
          <button className={styles.tag}>New Arrival</button>
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.sku}>SKU: {product.sku}</p>
          <div className={styles.reviews}>
            <span className={styles.rating}>
              {new Array(Math.trunc(4)).fill("").map((_, i) => (
                <FaStar key={i} />
              ))}
              <FaStarHalf />
              <span className={styles.ratingNumber}>(4.5)</span>
            </span>
            <span className={styles.reviewCount}>623 Reviews</span>
          </div>
          <p className={styles.price}>Rs {price * quantity}</p>
          <Quantity
            className={styles.quantity}
            quantity={quantity}
            min={1}
            onIncrement={() => setQuantity((qty) => qty + 1)}
            onDecrement={() => setQuantity((qty) => qty - 1)}
          />
          {couponError && <p className={styles.couponError}>{couponError}</p>}
          {coupon === "loading" ? (
            <div className={styles.spinnerContainer}>
              <ImSpinner9 className={styles.spinner} />
            </div>
          ) : coupon ? (
            <div className={styles.couponApplied}>
              <IoWalletSharp size={22} className={styles.wallet} />
              <p>YAY! You saved Rs {discount}</p>
              <p>{coupon} Coupon Applied</p>
              <LiaTimesCircleSolid
                size={20}
                className={styles.cross}
                onClick={couponRemoveHandler}
              />
            </div>
          ) : (
            <form
              onSubmit={applyCouponHandler}
              className={styles.discountCoupon}
            >
              <input
                type="text"
                name="couponCode"
                placeholder="Enter Coupon Code"
              />
              <button>Apply</button>
            </form>
          )}
          <div className={styles.cta}>
            <button className={styles.buyNow} onClick={buyNowHandler}>
              <MdLabelImportant />
              <span>Buy Now</span>
            </button>
            <button className={styles.addToBag} onClick={addToBagHandler}>
              <BsBagPlusFill />
              <span>Add to Bag</span>
            </button>
          </div>
          <div className={styles.attributes}>
            {product.attributes.length > 0 &&
              product.attributes.map((attribute, index) => (
                <div key={index} className={styles.attribute}>
                  <p>{attribute.name}</p>
                  {attribute.values.map((option, i) => (
                    <button
                      key={i}
                      className={
                        selectedAttribute[attribute.name] === option
                          ? styles.active
                          : ""
                      }
                      onClick={() =>
                        setSelectedAttribute((prevState) => {
                          const newState = {
                            ...prevState,
                            [attribute.name]: option,
                          };
                          return newState;
                        })
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ))}
          </div>
          <div className={styles.description}>
            <p>Description</p>
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
