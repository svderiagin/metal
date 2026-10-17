export const retainedCategoryIds = [
  "cat-arm",
  "cat-trp",
  "cat-trk",
  "cat-pnf",
  "cat-mesh",
  "cat-bal",
] as const;

const retainedCategoryIdSet = new Set<string>(retainedCategoryIds);

export function isRetainedCategory(categoryId: string) {
  return retainedCategoryIdSet.has(categoryId);
}
