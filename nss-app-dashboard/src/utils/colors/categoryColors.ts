export const getCategoryColor = (category: string): string => {
  const categoryMap: Record<string, string> = {
    "Area Based - 1": "bg-blue-500",
    "College Event": "bg-purple-500",
    Camp: "bg-orange-500",
    Workshop: "bg-indigo-500",
    Seminar: "bg-green-500",
    Training: "bg-yellow-500",
    Competition: "bg-red-500",
    "Social Service": "bg-teal-500",
  };

  const lowerCategory = category.toLowerCase();
  const matchedKey = Object.keys(categoryMap).find(
    (key) => key.toLowerCase() === lowerCategory
  );

  return matchedKey ? categoryMap[matchedKey] : "bg-gray-500";
};
