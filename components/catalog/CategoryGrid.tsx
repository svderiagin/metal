import type {Category} from "@/types/category";
import {CategoryCard} from "./CategoryCard";

export function CategoryGrid({categories}: { categories: Category[] }) {
  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category}/>
      ))}
    </div>
  );
}
