"use client";

import { Fragment, useEffect, useState } from "react";
import formStyles from "@/public/styles/form.module.css";
import styles from "./Attributes.module.css";

// default set
const DEFAULT_SET = {
  _id: "000000000000000000000000",
  name: "none",
  type: "none",
  attributes: [],
};

export default function Attributes({ attributeSets, defaultSet, attributes }) {
  // defaultSet means the that the product currently has
  // currentSet is already used thats why I had to name it defaultSet

  // function to get attributes of a set
  function getAttributesOfSet(setID) {
    const set = attributeSets.find((item) => item._id === setID);
    return set ? set : DEFAULT_SET;
  }

  // state to store current set
  const [currentSet, setCurrentSet] = useState(DEFAULT_SET);

  // set one current set out of all attribute sets on initial render and value of each attribute
  useEffect(() => {
    const set = attributeSets.find((item) => item._id === defaultSet) ?? DEFAULT_SET;
    if (attributes && attributes.length) {
      set.attributes.forEach((attribute) => {
        const { code } = attribute;
        const attr = attributes.find((attr) => attr.code === code);
        if (attr) {
          attribute.value = attr.value;
        }
      });
    }
    setCurrentSet(set);
  }, [attributes, defaultSet, attributeSets]);

  // function to handle select change
  const selectChangeHandler = (e) => {
    const selectedSet = getAttributesOfSet(e.target.value);
    setCurrentSet(selectedSet);
  };
  return (
    <Fragment>
      <label htmlFor="new-product-attribute-set" className={formStyles.label}>
        Select Attribute Set
      </label>
      <select
        id="new-product-attribute-set"
        className={formStyles.select}
        name="attribute_set"
        value={currentSet._id}
        onChange={selectChangeHandler}
      >
        <option value={DEFAULT_SET._id}>None</option>
        {attributeSets.map((attributeSet) => (
          <option key={attributeSet.name} value={attributeSet._id}>
            {attributeSet.name}
          </option>
        ))}
      </select>

      <hr />
      <label htmlFor="new-product-attribute" className={formStyles.label}>
        Attributes
      </label>

      {currentSet.attributes.map((attribute) => (
        <div key={attribute.code} className={styles.attribute}>
          <label htmlFor={attribute.code} className={formStyles.label}>
            {attribute.name}
          </label>
          {attribute.type.toLowerCase() === "select" ? (
            <select
              className={formStyles.select}
              name={attribute.name}
              id={attribute.code}
              defaultValue={attribute.value || ""}
            >
              {attribute.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id={attribute.code}
              name={attribute.name}
              className={formStyles.input}
              defaultValue={attribute.value || ""}
            />
          )}
        </div>
      ))}
    </Fragment>
  );
}
