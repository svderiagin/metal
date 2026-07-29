import type { Category } from "@/types/category"; import { CategoryCard } from "./CategoryCard";
export function CategoryGrid({categories}:{categories:Category[]}){return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{categories.map(c=><CategoryCard key={c.id} category={c}/>)}</div>}
