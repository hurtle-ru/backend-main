export class PageResponse<T> {
  items: T[];

  currentPage: number;

  perPage: number;

  total: number;

  totalPages: number;

  constructor(items: T[], currentPage: number, perPage: number, total: number,) {
    this.items = items;
    this.currentPage = currentPage;
    this.perPage = perPage;
    this.total = total;
    this.totalPages = Math.ceil(total / perPage,);
  }
}
