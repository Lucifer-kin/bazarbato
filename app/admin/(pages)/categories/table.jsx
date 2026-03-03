"use client";

import Link from "next/link";
import { Fragment, useState } from "react";

import formStyles from "@/public/styles/form.module.css";
import styles from "./page.module.css";

import Card from "@/components/Card/Card";
import CheckBox from "@/components/CheckBox/CheckBox";
import Modal from "@/components/_admin/Modal/Modal";
import Spinner from "@/components/_admin/Spinner/Spinner";
import { useRouter } from "next/navigation";
import TableFoot from "@/components/_admin/TableFoot/TableFoot";

export default function CategoryTable({
  categories,
  deleteCategories,
  totalCount,
}) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [modal, setModal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const categorySelectHandler = (e) => {
    const { value } = e.target;
    if (selectedCategories.includes(value)) {
      setSelectedCategories((prev) => prev.filter((item) => item !== value));
    } else {
      setSelectedCategories((prev) => [...prev, value]);
    }
  };

  // function to delete the selected categories
  const categoryDeleteHandler = async (categoryIDs) => {
    try {
      setModal(false);
      setSelectedCategories([]);
      setLoading(true);
      const response = await deleteCategories(categoryIDs);
      if (response.error) {
        setLoading(false);
        setError(response.error);
      } else {
        setLoading(false);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setError("Some error occured. Try refreshing the page");
    }
  };
  const btn1Text = error ? "Ok" : "Delete";
  const bgColor2 = error ? "#2c6ecb" : "#d72c0d";
  const word = selectedCategories.length > 1 ? "categories" : "category";
  const grammar = selectedCategories.length > 1 ? "these" : "this";

  const title = error
    ? "Error Occured!!"
    : `Delete ${selectedCategories.length} ${word}`;
  const paragraph =
    error || `Are you sure you want to delete ${grammar} ${word}?`;
  const onOk = () => {
    if (error) {
      setError(null);
      setModal(false);
    } else {
      categoryDeleteHandler(selectedCategories);
    }
  };

  if (loading) return <Spinner />;

  return (
    <Fragment>
      {(error || modal) && (
        <Modal
          btn1Text={btn1Text}
          btn2Text="Cancel"
          bgColor2={bgColor2}
          onOk={onOk}
          onCancel={() => setModal(false)}
          title={title}
          paragraph={paragraph}
        />
      )}

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
          <option value="parent">Parent Catgory</option>
          <option value="child">Child Category</option>
        </select>
        <select className={`${formStyles.select} ${styles.sort}`}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="nameAsc">Name: A to Z</option>
          <option value="nameDesc">Name: Z to A</option>
          <option value="productsAsc">No. of products: Low to High</option>
          <option value="productsDesc">No. of products: High to Low</option>
        </select>

        {selectedCategories.length > 0 && (
          <div className={styles.controls}>
            <div className={styles.no_of_selected_items}>
              {selectedCategories.length} selected
            </div>
            <div className={styles.delete_btn} onClick={() => setModal(true)}>
              Delete
            </div>
          </div>
        )}

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkbox}></th>
              <th className={styles.name}>Category Name</th>
              <th className={styles.no_of_products}>No. of products</th>
              <th className={styles.type}>Type</th>
              <th className={styles.is_in_menu}>Include in menu</th>
              <th className={styles.status}>Status</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id}>
                <td className={styles.checkbox}>
                  <CheckBox
                    id={`categories-${category._id}`}
                    value={category._id}
                    checked={selectedCategories.includes(category._id)}
                    onChange={categorySelectHandler}
                  />
                </td>
                <td className={styles.name}>
                  <Link
                    href={`/admin/new-category?category=${category.url_key}`}
                  >
                    {category.name}
                  </Link>
                </td>
                <td className={styles.no_of_products}>
                  {category?.productCount || 0}
                </td>
                <td className={styles.type}>
                  {category.isParent ? "Parent" : "Child"}
                </td>
                <td className={styles.is_in_menu}>{category.visibility}</td>
                <td className={styles.status}>
                  <span
                    className={
                      category.status === "disabled" ? styles.disabled : ""
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TableFoot total={totalCount} />
      </Card>
    </Fragment>
  );
}
