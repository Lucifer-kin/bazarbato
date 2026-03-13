"use client";

import { Fragment, useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/Card/Card";
import DND from "@/components/_admin/DND/DND";
import RadioButton from "@/components/RadioButton/RadioButton";
import InputError from "@/components/InputError/InputError";

import styles from "./page.module.css";
import formStyles from "@/public/styles/form.module.css";
import Attributes from "@/components/_admin/Attributes/Attributes";
import Spinner from "@/components/_admin/Spinner/Spinner";
import Modal from "@/components/_admin/Modal/Modal";

// Null erros
// these errors are shown initially when the the page is in edit mode
const NULL_ERRORS = {
  name: { message: "", touched: true },
  sku: { message: "", touched: true },
  price: { message: "", touched: true },
  category: { message: "", touched: true },
  description: { message: "", touched: true },
  image: { message: "", touched: true },
  qty: { message: "", touched: true },
  "url-key": { message: "", touched: true },
  "meta-title": { message: "", touched: true },
  "meta-keywords": { message: "", touched: true },
  "meta-description": {
    message: "",
    touched: true,
  },
};

// validation errors
// these errors are shown when the user has not interacted with the form
// the errors has a message and a touched property
// the touched property is used to check if the user has interacted with the input field
// if the user has not interacted with the input field, then the error message is not shown
const VALIDATION_ERRORS = {
  name: { message: "Name must be at least 3 characters", touched: false },
  sku: { message: "SKU is required", touched: false },
  price: { message: "Price must be a greater than zero", touched: false },
  category: { message: "Category is required", touched: false },
  description: { message: "Description is required", touched: false },
  image: { message: "At least one image is required", touched: false },
  qty: { message: "Quantity must be a positive number", touched: false },
  "url-key": { message: "Url key is required", touched: false },
  "meta-title": { message: "Meta title is required", touched: false },
  "meta-keywords": { message: "Meta keywords is required", touched: false },
  "meta-description": {
    message: "Meta description is required",
    touched: false,
  },
};

// reducer function
function reducer(state, action) {
  const payload = action.payload;
  const error = { message: "", touched: true };
  // switch case to check the type of action
  switch (action.type) {
    case "NAME":
      error.message = payload.length < 3 ? VALIDATION_ERRORS.name.message : "";
      return { ...state, name: error };
    case "SKU":
      error.message = payload;
      return { ...state, sku: error };
    case "PRICE":
      error.message = isNaN(payload)
        ? "Price must be a number"
        : payload <= 0
          ? VALIDATION_ERRORS.price.message
          : "";
      return { ...state, price: error };
    case "CATEGORY":
      error.message =
        !payload.length || payload.toLowerCase() === "none"
          ? VALIDATION_ERRORS.category.message
          : "";
      return { ...state, category: error };
    case "DESCRIPTION":
      error.message = !payload.length
        ? VALIDATION_ERRORS.description.message
        : "";
      return { ...state, description: error };
    case "IMAGE":
      // counting the number of images
      // if the number of images is less than or equal to 0, then show the error
      error.message = payload === 0 ? VALIDATION_ERRORS.image.message : "";
      return { ...state, image: error };
    case "QTY":
      error.message = isNaN(payload)
        ? "Quantity must be a number"
        : payload < 0
          ? VALIDATION_ERRORS.qty.message
          : "";
      return { ...state, qty: error };
    case "URL-KEY":
      error.message = payload;
      return { ...state, "url-key": error };
    case "META-TITLE":
      error.message = !payload.length
        ? VALIDATION_ERRORS["meta-title"].message
        : "";
      return { ...state, "meta-title": error };
    case "META-KEYWORDS":
      error.message = !payload.length
        ? VALIDATION_ERRORS["meta-keywords"].message
        : "";
      return { ...state, "meta-keywords": error };
    case "META-DESCRIPTION":
      error.message = !payload.length
        ? VALIDATION_ERRORS["meta-description"].message
        : "";
      return { ...state, "meta-description": error };
    case "RESET":
      return { ...VALIDATION_ERRORS };
    case "SET_ERRORS":
      return { ...payload };
    default:
      return { ...state };
  }
}

// handle initial image loading
function handleInitialImageLoading(existingImages) {
  const newImages = [null, null, null, null, null];
  if (existingImages && Array.isArray(existingImages)) {
    for (let i = 0; i < 5; i++) {
      newImages[i] = existingImages[i] || null;
    }
  }
  return newImages;
}

// rendering the form
export default function NewProductForm({
  attributeSets,
  handleSubmit,
  checkIfProductExists,
  product,
  categories,
}) {
  const router = useRouter();
  const [errors, dispatch] = useReducer(reducer, VALIDATION_ERRORS);
  const [responseError, setResponseError] = useState("");
  const [sku, setSku] = useState(product ? product.sku : "");
  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState(
    handleInitialImageLoading(product.images),
  );
  // if the form is in edit mode, then set the errors to null initially
  useEffect(() => {
    if (product) {
      dispatch({ type: "SET_ERRORS", payload: NULL_ERRORS });
    }
  }, [product]);

  // setting the image in the images array using useState hook
  const imageChangeHandler = (file, index) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
    dispatch({ type: "IMAGE", payload: newImages.filter((i) => i).length });
  };

  async function urlKeyChangeHandler(e) {
    const slug = e.target.value;
    if (slug.length < 3) {
      dispatch({
        type: "URL-KEY",
        payload: "Url key must be at least 3 characters",
      });
    } else {
      const productStatus = await checkIfProductExists({ "url-key": slug });
      if (productStatus.ack && productStatus.exists) {
        dispatch({ type: "URL-KEY", payload: "Url key already exists" });
      } else {
        dispatch({ type: "URL-KEY", payload: "" });
      }
    }
  }
  async function skuChangeHandler(e) {
    const product_sku = e.target.value;
    setSku(product_sku.toUpperCase().replace(" ", "_"));
    if (product_sku.length < 3) {
      dispatch({
        type: "SKU",
        payload: "SKU must be at least 3 characters",
      });
    } else {
      const productStatus = await checkIfProductExists({ sku: product_sku });
      if (productStatus.ack && productStatus.exists) {
        dispatch({ type: "SKU", payload: "SKU key already exists" });
      } else {
        dispatch({ type: "SKU", payload: "" });
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  // this function is called when the form is submitted
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // checking if the form is valid and all the fields are filled correctly
    const isFormValid = Object.values(errors).every((error) => !error.message);
    // if the form is not touched, then set the default errors
    // it means that the user has not interacted with the form
    if (isFormValid) {
      // creating a new form data object
      const formData = new FormData(e.target);
      // append the product id to the form data if the product is in edit mode
      formData.append("_id", product && product._id ? product._id : "");
      // appending the images to the form data
      images.map((image) => formData.append("images", image));
      // calling the handleSubmit function
      try {
        setLoading(true);
        const response = await handleSubmit(formData);
        if (response) {
          router.push("/admin/products");
        } else {
          setLoading(false);
          setResponseError(
            "Server Error, Couldnot save the product. Try refreshing the page",
          );
        }
      } catch (error) {
        setLoading(false);
        setResponseError(
          "Server Error, Couldnot save the product. Try refreshing the page",
        );
        setSku("");
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
          onCancel={setResponseError.bind(null, "")}
          title="Some Error Occured!!"
          paragraph={responseError}
        />
      )}
      <form
        className={styles.wrapper}
        onSubmit={handleFormSubmit}
        // action={handleSubmit}
        noValidate
        encType="multipart/form-data"
      >
        <Card className={`${styles.general} ${styles.card}`}>
          <span className={styles.cardTitle}>General</span>
          <Fragment key="name">
            <label htmlFor="new-product-name" className={formStyles.label}>
              Name
            </label>
            <input
              id="new-product-name"
              className={formStyles.input}
              type="text"
              name="name"
              placeholder="Name"
              defaultValue={product ? product.name : ""}
              onChange={(e) =>
                dispatch({ type: "NAME", payload: e.target.value })
              }
            />
            <InputError errors={errors} name="name" />
          </Fragment>

          <Fragment key="sku">
            <label
              htmlFor="new-product-sku"
              className={`${formStyles.label} ${styles.price}`}
            >
              SKU
            </label>
            <input
              id="new-product-sku"
              className={`${formStyles.input} ${styles.sku}`}
              type="text"
              name="sku"
              placeholder="SKU"
              disabled={Boolean(product)}
              value={sku}
              onChange={skuChangeHandler}
            />
            <InputError errors={errors} name="sku" />
          </Fragment>

          <Fragment key="price">
            <label
              htmlFor="new-product-price"
              className={`${formStyles.label} ${styles.price}`}
            >
              Price (Rs)
            </label>
            <input
              id="new-product-price"
              className={`${formStyles.input} ${styles.price}`}
              type="number"
              name="price"
              placeholder="Price"
              step={0.01}
              min={0}
              defaultValue={product ? product.price : ""}
              onChange={(e) =>
                dispatch({ type: "PRICE", payload: e.target.value })
              }
            />
            <InputError errors={errors} name="price" />
          </Fragment>

          <Fragment>
            <label htmlFor="new-product-category" className={formStyles.label}>
              Category
            </label>
            <select
              id="new-product-category"
              className={formStyles.select}
              name="category"
              defaultValue={product ? product.category._id : "none"}
              onChange={(e) =>
                dispatch({ type: "CATEGORY", payload: e.target.value })
              }
            >
              <option value="none">None</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <InputError errors={errors} name="category" />
          </Fragment>

          <Fragment>
            <label
              htmlFor="new-product-description"
              className={formStyles.label}
            >
              Description
            </label>
            <InputError errors={errors} name="description" />
            <textarea
              name="description"
              id="new-product-description"
              className={formStyles.textarea}
              placeholder="Description"
              defaultValue={product ? product.description : ""}
              onChange={(e) =>
                dispatch({ type: "DESCRIPTION", payload: e.target.value })
              }
            />
          </Fragment>
        </Card>

        <Card className={`${styles.media} ${styles.card}`}>
          <span className={styles.cardTitle}>
            Media
            <InputError errors={errors} name="image" />
          </span>
          {images.map((_, index) => (
            <DND
              key={index}
              className={styles.imagePicker}
              defaultimage={product?.images[index]}
              onUpload={(file) => imageChangeHandler(file, index)}
            />
          ))}
        </Card>

        <Card className={`${styles.seo} ${styles.card}`}>
          <span className={styles.cardTitle}>Search Engine Optimization</span>
          <Fragment>
            <label htmlFor="new-product-url-key" className={formStyles.label}>
              Url key
            </label>
            <input
              id="new-product-url-key"
              className={formStyles.input}
              type="text"
              name="url_key"
              placeholder="products/<your-key>"
              defaultValue={product ? product.url_key : ""}
              disabled={Boolean(product)}
              onChange={urlKeyChangeHandler}
            />
            <InputError errors={errors} name="url-key" />
          </Fragment>

          <Fragment>
            <label
              htmlFor="new-product-meta-title"
              className={formStyles.label}
            >
              Meta Title
            </label>
            <input
              id="new-product-meta-title"
              className={formStyles.input}
              type="text"
              name="meta_title"
              placeholder="Title"
              defaultValue={product ? product.meta_title : ""}
              onChange={(e) =>
                dispatch({ type: "META-TITLE", payload: e.target.value })
              }
            />
            <InputError errors={errors} name="meta-title" />
          </Fragment>

          <Fragment>
            <label
              htmlFor="new-product-meta-keywords"
              className={formStyles.label}
            >
              Meta Keywords
            </label>
            <input
              id="new-product-meta-keywords"
              className={formStyles.input}
              type="text"
              name="meta_keywords"
              placeholder="Keywords"
              defaultValue={product ? product.meta_keywords : ""}
              onChange={(e) =>
                dispatch({ type: "META-KEYWORDS", payload: e.target.value })
              }
            />
            <InputError errors={errors} name="meta-keywords" />
          </Fragment>

          <Fragment>
            <label
              htmlFor="new-product-meta-description"
              className={formStyles.label}
            >
              Meta Description
            </label>
            <textarea
              id="new-product-meta-description"
              className={formStyles.textarea}
              type="text"
              name="meta_description"
              placeholder="Description"
              defaultValue={product ? product.meta_description : ""}
              onChange={(e) =>
                dispatch({ type: "META-DESCRIPTION", payload: e.target.value })
              }
            />
            <InputError errors={errors} name="meta-description" />
          </Fragment>
        </Card>

        <Card className={`${styles.productStatus} ${styles.card}`}>
          <span className={styles.cardTitle}>Product Status</span>
          <label className={formStyles.label}>Status</label>
          <RadioButton
            name="status"
            value="disabled"
            className={styles.radio}
            labelclassname={styles.radioText}
            defaultChecked
          >
            Disabled
          </RadioButton>
          <RadioButton
            name="status"
            value="enabled"
            className={styles.radio}
            labelclassname={styles.radioText}
            defaultChecked={!product || product.status === "enabled"}
          >
            Enabled
          </RadioButton>
          <hr />

          <label className={formStyles.label}>Visibility</label>
          <RadioButton
            defaultChecked
            name="visibility"
            value="not-visible"
            className={styles.radio}
            labelclassname={styles.radioText}
          >
            Not visible
          </RadioButton>
          <RadioButton
            name="visibility"
            value="visible"
            className={styles.radio}
            labelclassname={styles.radioText}
            defaultChecked={!product || product.visibility === "visible"}
          >
            Visible
          </RadioButton>
        </Card>

        <Card className={`${styles.inventory} ${styles.card}`}>
          <span className={styles.cardTitle}>Inventory</span>
          <label className={formStyles.label}>Stock Avaibility</label>
          <RadioButton
            value="no"
            defaultChecked
            name="stock_availability"
            className={styles.radio}
            labelclassname={styles.radioText}
          >
            No
          </RadioButton>
          <RadioButton
            value="yes"
            name="stock_availability"
            className={styles.radio}
            defaultChecked={!product || product.stock_availability === "yes"}
            labelclassname={styles.radioText}
          >
            Yes
          </RadioButton>
          <hr />
          <label htmlFor="new-product-quantity" className={formStyles.label}>
            Quantity
          </label>
          <input
            id="new-product-quantity"
            className={formStyles.input}
            type="number"
            name="quantity"
            placeholder="Quantity"
            defaultValue={product ? product.quantity : ""}
            onChange={(e) => dispatch({ type: "QTY", payload: e.target.value })}
          />
          <InputError errors={errors} name="qty" />
        </Card>

        <Card className={`${styles.variants} ${styles.card}`}>Variants</Card>

        <Card className={`${styles.attributes} ${styles.card}`}>
          <span className={styles.cardTitle}>Attributes</span>
          <Attributes
            attributeSets={attributeSets}
            defaultSet={product ? product.attributeSet : ""}
            attributes={product ? product.attributes : null}
          />
        </Card>

        <Card
          style={{ backgroundColor: "transparent" }}
          className={`${styles.footer} ${styles.card}`}
        >
          <button className={styles.saveButton} type="submit">
            Save
          </button>
          <button className={styles.cancelButton} type="reset">
            Reset
          </button>
        </Card>
      </form>
    </Fragment>
  );
}
