'use client';

import ProductItem from "@/components/_customer/ProductItem/ProductItem";
import styles from "./page.module.css";
import Image from "next/image";
import noResultsFound from "@/public/no-results-found.png";
import SearchFilter from "./search-filter";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

export default function Search() {
  const searchParams = useSearchParams();
  const query = decodeURI(searchParams.get('query') || '').trim();
  const category = searchParams.get('category') || '';
  const alphabet_sort = +(searchParams.get('alphabet_sort') || 1);
  const price_sort = +(searchParams.get('price_sort') || 1);
  const min = isNaN(searchParams.get('min')) ? 0 : +(searchParams.get('min') || 0);
  const max = isNaN(searchParams.get('max')) || +(searchParams.get('max') || 0) === 0 ? Infinity : +(searchParams.get('max') || Infinity);

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const lastProductRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const fetchProducts = async (pageNum) => {
    setLoading(true);
    const params = new URLSearchParams({
      query,
      category,
      alphabet_sort: alphabet_sort.toString(),
      price_sort: price_sort.toString(),
      min: min.toString(),
      max: max === Infinity ? '' : max.toString(),
      page: pageNum.toString(),
      limit: '20'
    });
    const res = await fetch(`/api/search?${params}`);
    const data = await res.json();
    setLoading(false);
    if (data.products.length < 20) {
      setHasMore(false);
    }
    setProducts(prev => [...prev, ...data.products]);
  };

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1);
  }, [query, category, alphabet_sort, price_sort, min, max]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page);
    }
  }, [page]);

  const title = category
    ? `Products of ${category}`
    : `Results for '${query}'`;

  return (
    <section className={styles.section}>
      {products?.length > 0 && <h1 className={styles.heading}>{title}</h1>}
      <SearchFilter
        className={styles.filter}
        query={query}
        category={category}
        alphabet_sort={alphabet_sort}
        price_sort={price_sort}
        min={min}
        max={max}
      />
      {products?.length > 0 ? (
        <div className={styles.results}>
          {products.map((product, index) => (
            <ProductItem
              key={product._id}
              className={styles.product}
              product={product}
              ref={index === products.length - 1 ? lastProductRef : null}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <div className={styles.noResults}>
            <h1 className={styles.heading}>
              {category ? "No products found" : `No results found for '${query}'`}
            </h1>
            <Image src={noResultsFound} alt="No results found" />
          </div>
        )
      )}
      {loading && <div>Loading...</div>}
    </section>
  );
}
