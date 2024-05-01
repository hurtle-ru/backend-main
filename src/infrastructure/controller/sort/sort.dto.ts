

/**
 * Parses an array of sortBy criteria into a generic Prisma orderBy object.
 * @param sortBys The array of sort criteria strings, e.g., ["createdAt_desc", "name_asc"].
 * @returns A generic orderBy array suitable for Prisma queries.
 */
export function parseSortBy<T>(sortBys: string[] | undefined): T[] {
  const orders: T[] = [];

  if (sortBys) {
    sortBys.forEach((sortBy) => {
      const [field, direction] = sortBy.split("_");
      if (direction === "asc" || direction === "desc") {
        // As TypeScript does not allow indexing by a variable of type string on a type parameter T directly,
        // we use a workaround by asserting the specific structure expected for Prisma's orderBy.
        const order: any = {};
        order[field] = direction;
        orders.push(order as T);
      }
    });
  }

  return orders;
}