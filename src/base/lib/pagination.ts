export function paginationItems(
  page: number,
  totalPages: number,
  boundary = 2,
): (number | string)[] {
  const total = Math.max(1, totalPages);
  const current = Math.max(1, Math.min(page, total));
  const pages = new Set<number>([current]);
  for (let index = 1; index <= Math.min(boundary, total); index++) {
    pages.add(index);
    pages.add(total - index + 1);
  }
  const result: (number | string)[] = [];
  let previous = 0;
  for (const value of [...pages].sort((a, b) => a - b)) {
    if (value - previous === 2) result.push(value - 1);
    else if (value - previous > 2) result.push(`ellipsis-${previous}`);
    result.push(value);
    previous = value;
  }
  if (total - previous === 1) result.push(total);
  else if (total > previous) result.push("ellipsis-end");
  return result;
}
