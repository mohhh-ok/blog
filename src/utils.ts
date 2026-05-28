// 日付フォーマット用の関数
export const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
  }).format(date);
};

export const combineDates = (params: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  aboutYear: number | undefined;
}) => {
  const { aboutYear, startDate, endDate } = params;
  if (aboutYear) return `${aboutYear}年頃`;
  if (!startDate) return "";
  return `${formatDate(startDate)} - ${endDate ? formatDate(endDate) : "現在"}`;
};
