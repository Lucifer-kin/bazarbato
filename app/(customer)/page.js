// core modules
import { Fragment } from "react";

// helper functions
import { deepCopy } from "@/helpers/utils";
import dbConnect from "@/helpers/dbConnect";

// database models
import Product from "@/models/Product";
import CategoryDoc from "@/models/Category";
import SiteContent from "@/models/SiteContent";

// custom components
import Banner from "@/components/_customer/Banner/Banner";
import Category from "@/components/_customer/Category/Category";
import Testimonials from "@/components/_customer/Testimonials/Testimonials";
import ProductContainer from "@/components/_customer/ProductContainer/ProductContainer";

async function getRecommendedProducts(count=12) {
  try {
    await dbConnect();
    const products = await Product.aggregate([
      // 1. Get 12 random documents
      { $sample: { size: count } },

      // 2. "Populate" the category (Join the categories collection)
      {
        $lookup: {
          from: "categories", // The actual name of the collection in MongoDB (usually lowercase plural)
          localField: "category", // The field in Product
          foreignField: "_id", // The field in Category
          as: "category", // Output array name
        },
      },

      // 3. Convert the category array back to a single object (since $lookup returns an array)
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // 4. "Select" specific fields (1 = include, 0 = exclude)
      {
        $project: {
          name: 1,
          price: 1,
          images: 1,
          url_key: 1,
          "category.name": 1,
          "category.code": 1,
        },
      },
    ]);
    return deepCopy(products);
  } catch (error) {
    console.log("Error fetching recommended products:", error);
    return [];
  }
}

export async function getBestSellerProducts() {
  try {
    await dbConnect();
    // const { products } = await SiteContent.findOne({
    //   subject: "BEST_SELLERS",
    // })
    //   .populate({ path: "products", select: "name price images url_key" })
    //   .lean();
    const products = await getRecommendedProducts(5);

    // this is a dummy calculation for MRP because I don't have MRP in the database
    const productsWithMrp = products.map((product) => ({
      ...product,
      rating: Math.ceil(Math.random() * 5),
      mrp: Math.ceil(product.price * Math.random() * 1.5),
    }));
    return deepCopy(productsWithMrp);
  } catch (error) {
    console.log("error from fetch best seller products", error);
    return [];
  }
}

export async function getFeaturedCategories() {
  try {
    await dbConnect();
    // Fetch parent categories from the `SiteContent`
    const { categories: parentCategories } = await SiteContent.findOne({
      subject: "FEATURED_CATEGORIES",
    })
      .populate("categories", "name code banner")
      .lean();
    
    

    // Retrieve subcategories for each parent category
    const categoriesWithSubcategories = await CategoryDoc.aggregate([
      {
        $match: {
          _id: { $in: parentCategories.map((cat) => cat._id) }, // Match parent categories
        },
      },
      {
        $lookup: {
          from: "categories", // Collection to lookup (assuming it's "categories")
          localField: "_id", // Parent category _id
          foreignField: "parent", // Field in subcategories that points to the parent
          as: "subCategories", // The field to add subcategories
        },
      },
      {
        $unwind: "$subCategories", // Unwind subCategories to apply product count individually
      },
      {
        $lookup: {
          from: "products", // Collection to lookup (assuming it's "products")
          localField: "subCategories._id", // Subcategory _id
          foreignField: "category", // Field in products that refers to category
          as: "subCategoryProducts", // The field to hold matched products
        },
      },
      {
        $group: {
          _id: "$_id", // Group by parent category ID
          name: { $first: "$name" },
          code: { $first: "$code" },
          banner: { $first: "$banner" },
          subCategories: {
            $push: {
              _id: "$subCategories._id",
              name: "$subCategories.name",
              code: "$subCategories.code",
              banner: "$subCategories.banner",
              productCount: { $size: "$subCategoryProducts" }, // Count products for this subcategory
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          banner: 1,
          // Limit subCategories to 5 items
          subCategories: { $slice: ["$subCategories", 5] },
        },
      },
    ]);
    return deepCopy(categoriesWithSubcategories);
  } catch (error) {
    return [];
  }
}

async function getDealOfTheDay() {
  try {
    await dbConnect();
    const { products } = await SiteContent.findOne({
      subject: "DEAL_OF_THE_DAY",
    })
      .populate({ path: "products", select: "name price images url_key" })
      .lean();
    return deepCopy(products[0]);
  } catch (error) {
    return null;
  }
}

async function getFeaturedProducts(feature) {
  if (!feature) return [];
  try {
    await dbConnect();
    const { products } = await SiteContent.findOne({
      subject: feature,
    })
      .populate({
        path: "products",
        populate: { path: "category", select: "name code" },
        select: "name price images url_key",
      })
      .lean();
    return deepCopy(products);
  } catch (error) {
    console.log(error);
    return [];
  }
}
async function getTrendingProducts() {
  return getFeaturedProducts("TRENDING_PRODUCTS");
}
async function getNewArrivals() {
  return getFeaturedProducts("NEW_ARRIVALS");
}
async function getTopRatedProducts() {
  return getFeaturedProducts("TOP_RATED_PRODUCTS");
}

export default async function Home() {
  const [
    products,
    bestSellerProducts,
    featuredCategories,
    dealOfTheDay,
    trendingProducts,
    newArrivals,
    topRatedProducts,
  ] = await Promise.all([
    getRecommendedProducts(600),
    getBestSellerProducts(),
    getFeaturedCategories(),
    getDealOfTheDay(),
    getTrendingProducts(),
    getNewArrivals(),
    getTopRatedProducts(),
  ]);
  return (
    <Fragment>
      <Banner />
      <Category />
      <ProductContainer
        products={products}
        bestSellerProducts={bestSellerProducts}
        featuredCategories={featuredCategories}
        dealOfTheDay={dealOfTheDay}
        trendingProducts={trendingProducts}
        newArrivals={newArrivals}
        topRatedProducts={topRatedProducts}
      />
      <Testimonials />
    </Fragment>
  );
}
