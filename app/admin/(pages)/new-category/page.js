import Category from "@/models/Category";

import { checkIfCategoryExists, deleteFile, uploadFile } from "@/helpers/crud";

import styles from "./page.module.css";

import AdminPageHeading from "@/components/Utils/AdminPageHeading";
import CategoryForm from "./form";
import dbConnect from "@/helpers/dbConnect";
import { deepCopy } from "@/helpers/utils";
import { revalidatePath } from "next/cache";

async function handleSubmit(formData) {
  "use server";

  try {
    await dbConnect();
  } catch (error) {
    return { error: "Cannot connect to database" };
  }
  const _id = formData.get("_id");
  const name = formData.get("name");
  const categoryCode = formData.get("code");
  const isParent = formData.get("is-parent-category") === "true";
  let parentCategory = formData.get("parent");
  const description = formData.get("description");
  const banner = formData.get("banner");
  const status = formData.get("status");
  const visibility = formData.get("include-in-menu");
  const url_key = formData.get("url-key");
  const meta_title = formData.get("meta-title");
  const meta_description = formData.get("meta-description");
  const meta_keywords = formData.get("meta-keywords");

  if (!isParent) {
    try {
      parentCategory = await Category.findById(parentCategory).lean();
      if (!parentCategory) return { error: "Parent category does not exist" };
    } catch (error) {
      return { error: "Parent category does not exist" };
    }
  }

  if (!_id) {
    // check if code and url_key already exists
    try {
      const codeAndKeyExists = await Category.findOne({
        $or: [{ code: categoryCode }, { url_key }],
      });
      if (codeAndKeyExists)
        return { error: "Category code or url_key already exists" };
    } catch (error) {
      return { error: "Category code or url_key already exists" };
    }
  }
  // check if its a update request or a new category request
  // if a category exists then update the category
  // else create a new category
  let existingCategory = null;
  try {
    existingCategory = await Category.findById(_id);
  } catch (error) {
    existingCategory = null;
  }
  let category;
  if (existingCategory) {
    category = existingCategory;
    // update data
    category.name = name;
    category.code = existingCategory.code;
    category.isParent = existingCategory.isParent;
    // a child category can't be converted to a parent category
    // and a parent category can't be converted to a child category
    // but a child category can be moved to another parent category
    // so if the child category has a parent category then update the parent category
    // else the child category will have the existing parent category
    if (!existingCategory.isParent)
      category.parent = parentCategory || existingCategory.parent;
    category.description = description;
    // if the banner is a file and the category exists
    // then delete the existing banner and upload the new banner
    let bannerUrl = category.banner;
    if (banner && typeof banner !== "string") {
      try {
        const response = await Promise.all([
          uploadFile(
            banner,
            `category/${existingCategory.url_key}/${banner.name}`
          ),
          // deleteFile(category.banner),
        ]);
        const responseOfBannerUpload = response[0];
        bannerUrl = responseOfBannerUpload.url;
      } catch (error) {
        return { error: "Error while uploading banner" };
      }
    }
    category.banner = bannerUrl;
    category.status = status;
    category.visibility = visibility;
    category.url_key = existingCategory.url_key;
    category.meta_title = meta_title;
    category.meta_description = meta_description;
    category.meta_keywords = meta_keywords;
  } else {
    let bannerUrl;
    try {
      if (!url_key)
        return { error: "Banner update failed. url key is required" };
      bannerUrl = await uploadFile(
        banner,
        `category/${url_key}/${banner.name}`
      );
    } catch (error) {
      return { error: "Error while uploading banner" };
    }
    category = new Category({
      name,
      code: categoryCode,
      isParent,
      parent: parentCategory,
      description,
      banner: bannerUrl.url,
      status,
      visibility,
      url_key,
      meta_title,
      meta_description,
      meta_keywords,
    });
    if (isParent) {
      category.children = [];
    } else {
      category.parent = parentCategory;
      category.products = [];
    }
  }
  try {
    await category.save();
    revalidatePath("/admin/new-category");
  } catch (error) {
    return { error: "Error while saving category" };
  }
  return { error: null };
}

// function to fetch the category by its url_key
async function getCategoryByUrlKey(url_key) {
  try {
    if (!url_key) return null;
    await dbConnect();
    const category = await Category.findOne({ url_key });
    return deepCopy(category);
  } catch {
    return null;
  }
}

// function to fetch the parent categories available
async function getParentCategories() {
  try {
    await dbConnect();
    const parentCategories = await Category.find({
      status: "enabled",
      isParent: true,
    })
      .select("name")
      .lean();
    return deepCopy(parentCategories);
  } catch {
    return Promise.resolve([]);
  }
}

export default async function NewCategory({
  searchParams: { category: slug },
}) {
  const [parentCategories, category] = await Promise.all([
    getParentCategories(),
    getCategoryByUrlKey(slug),
  ]);

  return (
    <div className={`${styles.container} homepadding`}>
      <AdminPageHeading back="/admin/categories" className={styles.title}>
        Create A New Category
      </AdminPageHeading>

      <CategoryForm
        handleSubmit={handleSubmit}
        checkIfCategoryExists={checkIfCategoryExists}
        category={category}
        parentCategories={parentCategories}
      />
    </div>
  );
}
