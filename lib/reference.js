"use client";
import {loadBrands, loadCategories} from "./api";
import {useResource} from "./useResource";
const loader = async () => {
  const [brands, categories] = await Promise.all([loadBrands(), loadCategories()]);
  return {brandNames: brands.map(b => b.name), categoryOptions: categories.map(c => ({value: c.nameEn, en: c.nameEn, ar: c.nameAr}))};
};
export function useReferences() {
  const resource = useResource(loader);
  return {...resource, brandNames: resource.data?.brandNames ?? [], categoryOptions: resource.data?.categoryOptions ?? []};
}
