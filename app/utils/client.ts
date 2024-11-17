export const convertNumberToLocaleString = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

export const getPaginationRange = (
  currentPage: number,
  pageSize: number,
  totalItems: number
) => {
  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalItems);

  return {
    startRange,
    endRange,
  };
};

export * from "./invariantResponse";
