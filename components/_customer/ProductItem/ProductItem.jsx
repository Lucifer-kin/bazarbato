import Link from "next/link";
import { forwardRef } from "react";

import { FaStar, FaStarHalf } from "react-icons/fa";

import styles from "./ProductItem.module.css";
import shoes from "@/public/images/products/1.jpg";
import Image from "next/image";

const ProductItem = forwardRef(function ProductItem({ className, product, ...rest }, ref) {
  if (!product) return <></>;
  return (
    <div ref={ref} className={[styles.product, className].join(" ")} {...rest}>
      <Link href={`/product/${product?.url_key}`}>
        <Image src={product?.images[0]} alt="shoes" width={250} height={250} />
        <Image
          src={product?.images[1] || product?.images[0]}
          alt="shoes"
          width={250}
          height={250}
        />
        <p className={styles.category_name}>
          {product?.category.name || "Clothes"}
        </p>
        <p className={styles.name}>
          {product?.name || "Relaxed short full sleeves"}
        </p>
        <div className={styles.rating}>
          <FaStar />
          <FaStar />
          <FaStar />
          <FaStar />
          <FaStar />
        </div>
        <span className={styles.price}>
          <b>Rs {product?.price}</b>
          <del>Rs {Math.floor(product?.price * 1.46)}</del>
        </span>
      </Link>
    </div>
  );
});

export default ProductItem;
