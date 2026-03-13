import dbConnect from "@/helpers/dbConnect";
import Product from "@/models/Product";
import { deepCopy } from "@/helpers/utils";
import Category from "@/models/Category";

async function getProducts({
  min,
  max,
  price_sort,
  query = "",
  category = "",
  alphabet_sort,
  page = 1,
  limit = 20,
}) {
  query = query?.trim?.();
  alphabet_sort = +alphabet_sort === 2 ? -1 : 1;
  price_sort = +price_sort === 2 ? 1 : -1;
  min = isNaN(min) ? 0 : +min;
  max = isNaN(max) ? Infinity : +max;
  page = +page || 1;
  limit = +limit || 20;

  try {
    await dbConnect();
    if (category) {
      category = await Category.findOne({ code: category })
        .lean()
        .select("_id");
      if (!category) return [];
    }
    if (!category && query?.length === 0) return [];

    let filter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { meta_keywords: { $regex: query, $options: "i" } },
        { meta_title: { $regex: query, $options: "i" } },
        { url_key: { $regex: query, $options: "i" } },
      ],
      price: { $gte: min, $lte: max },
    };
    if (category) {
      filter = { ...filter, category };
    }
    const products = await Product.find(filter)
      .sort({ name: alphabet_sort, price: price_sort })
      .populate("category", "name")
      .select("name price images category url_key rating")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return deepCopy(products);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const alphabet_sort = searchParams.get('alphabet_sort') || 1;
  const price_sort = searchParams.get('price_sort') || 1;
  const min = searchParams.get('min') || 0;
  const max = searchParams.get('max') || Infinity;
  const page = searchParams.get('page') || 1;
  const limit = searchParams.get('limit') || 20;

  const products = await getProducts({
    min,
    max,
    query,
    price_sort,
    alphabet_sort,
    category,
    page,
    limit,
  });

  return Response.json({ products });
}