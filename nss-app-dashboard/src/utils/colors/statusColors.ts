export const getStatusClasses = (status: string): string => {
  const statusMap: Record<string, string> = {
    Active: "text-green-400 bg-green-900/30",
    Inactive: "text-red-400 bg-red-900/30",
    Pending: "text-yellow-400 bg-yellow-900/30",
    Completed: "text-green-400 bg-green-900/30",
    Ongoing: "text-yellow-400 bg-yellow-900/30",
    Upcoming: "text-blue-400 bg-blue-900/30",
    Cancelled: "text-red-400 bg-red-900/30",
    Draft: "text-gray-400 bg-gray-900/30",
  };

  return statusMap[status] || "text-gray-400 bg-gray-900/30";
};

export const getImpactColor = (impact: string): string => {
  const impactMap: Record<string, string> = {
    High: "text-green-400",
    Medium: "text-yellow-400",
    Low: "text-orange-400",
  };

  return impactMap[impact] || "text-gray-400";
};

export const getAttendanceColor = (percentage: number): string => {
  if (percentage >= 75) return "text-green-400";
  if (percentage >= 50) return "text-yellow-400";
  return "text-red-400";
};
