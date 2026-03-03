"use client";

import { AiOutlineDoubleLeft, AiOutlineDoubleRight } from "react-icons/ai";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import styles from "./TableFoot.module.css";
import formStyles from "@/public/styles/form.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TableFoot({
  total,
  perPage = 10,
  page: initialPage = 1,
}) {
  const router = useRouter();
  const [itemsPerPage, setItemsPerPage] = useState(perPage);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    if (isNaN(itemsPerPage) || itemsPerPage < 1 || isNaN(page) || page < 1)
      return;
    const maxPage = Math.ceil(total / itemsPerPage) || 1;

    const timerId = setTimeout(() => {
      router.push(
        `?page=${page > maxPage ? maxPage : page}&perPage=${
          itemsPerPage > total ? total : itemsPerPage || perPage
        }`
      );
    }, 1000);
    return () => clearTimeout(timerId);
  }, [itemsPerPage, page, perPage, router, total]);

  const nextPage = () => {
    if (page < Math.ceil(total / itemsPerPage)) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const changePage = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) return;
    const maxPage = Math.ceil(total / itemsPerPage) || 1;
    setPage(value > maxPage ? maxPage : value);
  };

  return (
    <div className={styles.tableFoot}>
        <div className={styles.product_per_page}>
          Show
          <input
            className={formStyles.input}
            type="number"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(e.target.value)}
          />
          per page
        </div>

        <div className={styles.pagination}>
          <button className={styles.first} onClick={() => setPage(1)}>
            <AiOutlineDoubleLeft />
          </button>
          <button className={styles.prev} onClick={prevPage}>
            <HiOutlineChevronLeft />
          </button>
          <input
            className={formStyles.input}
            type="number"
            value={page}
            min={1}
            onChange={changePage}
          />
          <button className={styles.next} onClick={nextPage}>
            <HiOutlineChevronRight />
          </button>
          <button
            className={styles.last}
            onClick={() => setPage(Math.ceil(total / itemsPerPage) || 1)}
          >
            <AiOutlineDoubleRight />
          </button>
          <span>{total} records</span>
        </div>
    </div>
  );
}
