"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./page.module.css";
import formStyles from "@/public/styles/form.module.css";
import Card from "@/components/Card/Card";
import CheckBox from "@/components/CheckBox/CheckBox";
import Modal from "@/components/_admin/Modal/Modal";
import { useRouter } from "next/navigation";
import Spinner from "@/components/_admin/Spinner/Spinner";
import TableFoot from "@/components/_admin/TableFoot/TableFoot";

export default function AttributesClientPage({
  attributes,
  deleteAttributes,
  attributesCount,
}) {
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const attributeSelectHandler = (e) => {
    const attributeId = e.target.value;
    if (selectedAttributes.includes(attributeId)) {
      setSelectedAttributes((prev) =>
        prev.filter((item) => item !== attributeId)
      );
    } else {
      setSelectedAttributes((prev) => [...prev, attributeId]);
    }
  };

  const attributeDeleteHandler = async (selectedAttributes) => {
    try {
      setModal(false);
      setSelectedAttributes([]);
      setLoading(true);
      const response = await deleteAttributes(selectedAttributes);
      if (response.error) {
        setLoading(false);
        setError(response.error);
      } else {
        setLoading(false);
        router.refresh();
      }
    } catch (error) {
      setError("Server Error, Failed to delete attributes");
    }
  };

  const btn1Text = error ? "Okay" : "Delete";
  const bgColor1 = error ? "#0070f3" : "#d72c0d";
  const word = selectedAttributes.length > 1 ? "attributes" : "attribute";
  const grammar = selectedAttributes.length > 1 ? "these" : "this";
  const title = error
    ? "Error Occured!!"
    : `Delete ${selectedAttributes.length} ${word}`;
  const paragraph =
    error || `Are you sure you want to delete ${grammar} ${word}?`;
  const onOk = () => {
    if (error) {
      setError("");
      setModal(false);
    } else attributeDeleteHandler(selectedAttributes);
  };

  if (loading) return <Spinner />;

  return (
    <div className={styles.container}>
      {(error || modal) && (
        <Modal
          btn1Text={btn1Text}
          btn2Text="Cancel"
          bgColor2={bgColor1}
          onOk={onOk}
          onCancel={() => setModal(false)}
          title={title}
          paragraph={paragraph}
        />
      )}

      <div className={styles.title}>
        <h1>Attribute</h1>
        <Link className={styles.newCategoryLink} href="/admin/new-attribute">
          New Attribute
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
          <option value="productsAsc">No. of products: Low to High</option>
          <option value="productsDesc">No. of products: High to Low</option>
        </select>

        {selectedAttributes.length > 0 && (
          <div className={styles.controls}>
            <div className={styles.no_of_selected_items}>
              {selectedAttributes.length} selected
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
              <th className={styles.name}>Attribute Name</th>
              <th className={styles.type}>type</th>
              <th className={styles.code}>Code</th>
            </tr>
          </thead>
          <tbody>
            {attributes?.length > 0 &&
              attributes.map((attribute) => (
                <tr key={attribute._id}>
                  <td className={styles.checkbox}>
                    <CheckBox
                      id={`attributes-${attribute._id}`}
                      value={attribute._id}
                      checked={selectedAttributes.includes(attribute._id)}
                      onChange={attributeSelectHandler}
                    />
                  </td>
                  <td className={styles.name}>
                    <Link
                      href={`/admin/new-attribute?attribute=${attribute.code}`}
                    >
                      {attribute.name}
                    </Link>
                  </td>
                  <td className={styles.type}>{attribute.type}</td>
                  <td className={styles.code}>{attribute.code}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <TableFoot total={attributesCount} />
      </Card>
    </div>
  );
}
