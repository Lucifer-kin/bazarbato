import { redirect } from "next/navigation";

// product model or schema
import Product from "@/models/Product";
import AttributeSet from "@/models/AttributeSet";

// helper functions
import dbConnect from "@/helpers/dbConnect";
import { deepCopy } from "@/helpers/utils";
import { checkIfProductExists, deleteFile, uploadFile } from "@/helpers/crud";

import styles from "./page.module.css";
import AdminPageHeading from "@/components/Utils/AdminPageHeading";
import NewProductForm from "./form";
import Category from "@/models/Category";

export const metadata = {
  title: "Create a new product",
};

// function to update the uploaded images
async function imageUpdateHandler(images, existingImages, slug = "") {
  try {
    const response = [];
    for (let image of images) {
      if (existingImages.includes(image)) {
        response.push(Promise.resolve({ url: image }));
        continue;
      }
      if (
        image === "null" ||
        typeof image === "string" ||
        image.type.split("/")[0] !== "image"
      )
        continue;
      const filename = `products/${slug}/${image.name}`;
      console.log("uploading", filename);
      response.push(uploadFile(image, filename));
      console.log("uploaded", filename);
    }
    const imageNames = (await Promise.all(response)).map((image) => image.url);
    const deletionResponse = [];
    for (let image of existingImages) {
      if (imageNames.includes(image)) continue;
      deletionResponse.push(deleteFile(image));
    }
    await Promise.all(deletionResponse);
    return imageNames;
  } catch (error) {
    throw new Error("Error updating images");
  }
}

// function to upload images to the server
async function imageUploadHandler(images, slug = "") {
  try {
    let response = [];
    for (let imageFile of images) {
      if (imageFile === "null" || imageFile.type.split("/")[0] !== "image")
        continue;
      const filename = `products/${slug}/${imageFile.name}`;
      response.push(uploadFile(imageFile, filename));
    }
    let imageNames = await Promise.all(response);
    imageNames = imageNames.map((image) => image.url);
    return imageNames;
  } catch (error) {
    throw new Error("Error uploading images");
  }
}

async function formSubmitHandler(formData) {
  "use server";
  // connecting to database
  try {
    await dbConnect();
  } catch (error) {
    console.log("Error connecting to database", error);
    return { error: "Error connecting to database" };
  }
  // extracting input field values
  const _id = formData.get("_id");
  const name = formData.get("name");
  const sku = formData.get("sku");
  const price = formData.get("price");
  let category = formData.get("category");
  const description = formData.get("description");
  const images = formData.getAll("images");
  const key = formData.get("url_key");
  const url_key = key ? key.trim().replace(" ", "-") : "";
  const meta_title = formData.get("meta_title");
  const meta_keywords = formData.get("meta_keywords");
  const meta_description = formData.get("meta_description");
  const status = formData.get("status");
  const visibility = formData.get("visibility");
  const stock_availability = formData.get("stock_availability");
  const quantity = formData.get("quantity");
  const attributeSet = formData.get("attribute_set");

  try {
    // checking if the product with the same url_key already exists
    const existingProduct = _id && (await Product.findOne({ _id }));

    // updating images if the product already exists
    // else uploading the images
    let imageNames = existingProduct
      ? imageUpdateHandler(
          images,
          existingProduct.images,
          existingProduct.url_key
        )
      : imageUploadHandler(images, url_key);

    // fetching schema of attributes of the selected attribute set from database
    let attributeSetSchema =
      AttributeSet.findById(attributeSet).populate("attributes");

    // combining both promises to get the resolved values and reducing the time taken
    [imageNames, attributeSetSchema] = await Promise.all([
      imageNames,
      attributeSetSchema,
    ]);

    const attributes = attributeSetSchema
      ? attributeSetSchema.attributes.map((attribute) => {
          const code = attribute.code;
          const name = attribute.name;
          const type = attribute.type;
          const value = formData.get(name);
          if (existingProduct) {
            // first find that attribute in the existing product
            const selectedAttribute = existingProduct.attributes.find(
              (attr) => attr.code === code
            );
            // only change the first value of the attribute
            // because the rest of the values are handled by variants
            // e.g. color: [red, blue, green] red is default product attribute and rest are variants
            selectedAttribute.values[0] = value;
            return {
              code,
              name,
              type,
              values: selectedAttribute.values,
            };
          }
          return { code, name, type, values: [value] };
        })
      : [];
    let product;
    if (existingProduct) {
      // updating the existing product object
      product = existingProduct;
      product.name = name;
      product.price = price;
      product.category = category;
      product.description = description;
      product.images = imageNames;
      product.meta_title = meta_title;
      product.meta_keywords = meta_keywords;
      product.meta_description = meta_description;
      product.status = status;
      product.visibility = visibility;
      product.stock_availability = stock_availability;
      product.quantity = quantity;
      product.attributeSet = attributeSet;
      product.attributes = attributes;
    } else {
      // creating a new product object
      product = new Product({
        name,
        sku,
        price,
        category,
        description,
        images: imageNames,
        url_key,
        meta_title,
        meta_keywords,
        meta_description,
        status,
        visibility,
        stock_availability,
        quantity,
        attributeSet,
        attributes,
      });
    }
    // saving the product to the database
    await product.save();
    return true;
  } catch (error) {
    console.log("Error from here", error.message);
    return false;
  }
}

// function to fetch attributes
async function fetchAttributes() {
  await dbConnect();
  const attributeSets = await AttributeSet.find().populate("attributes");
  const formattedAttributes = attributeSets.map((attributeSet) => {
    return {
      _id: attributeSet._id.toString(),
      name: attributeSet.name,
      attributes: attributeSet.attributes.map((attribute) => {
        const modifiedAttribute = {
          name: attribute.name,
          code: attribute.code,
          type: attribute.type,
        };
        if (attribute.type.toLowerCase() === "select") {
          modifiedAttribute.options = attribute.options;
        }
        return modifiedAttribute;
      }),
    };
  });
  return formattedAttributes;
}

async function getCategories() {
  try {
    await dbConnect();
    const categories = await Category.find({
      visibility: "yes",
      status: "enabled",
      isParent: false,
    }).select("name code");
    return deepCopy(categories);
  } catch(error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// function to get the product data if the form is in edit mode
async function getProduct(url_key) {
  try {
    await dbConnect();
    const product = await Product.findOne({ url_key }).populate(
      "category",
      "name code"
    );
    return product;
  } catch(error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function NewProduct({ searchParams: { product: slug } }) {
  const [attributeSets, categories, product] = await Promise.all([
    fetchAttributes(),
    getCategories(),
    getProduct(slug),
  ]);
  return (
    <div className={`${styles.container} homepadding`}>
      <AdminPageHeading back="/admin/products">
        Create A New Product
      </AdminPageHeading>
      <NewProductForm
        attributeSets={attributeSets}
        handleSubmit={formSubmitHandler}
        checkIfProductExists={checkIfProductExists}
        product={deepCopy(product)}
        categories={categories}
      />
    </div>
  );
}
