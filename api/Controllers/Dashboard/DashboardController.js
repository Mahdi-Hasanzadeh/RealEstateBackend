import { ListingDeletionModel } from "../../Models/Deletions/ListingsDeletions.js";
import { cellPhoneAndTabletsModel } from "../../Models/Products/cellPhoneAndTabletsModel.js";
import { computerModel } from "../../Models/Products/computerModel.js";
import { listingModel } from "../../Models/Products/listingModel.js";

// ---- Helper: last 6 months ----
function getLast6Months() {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString("default", { month: "short" });
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      name: monthName,
    });
  }

  return months;
}

// ---- Helper: total listings per month ----
async function getTotalListingsByMonth(year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1);

  const totalListings = await listingModel.countDocuments({
    createdAt: { $gte: startOfMonth, $lt: endOfMonth },
  });

  const totalCellPhones = await cellPhoneAndTabletsModel.countDocuments({
    createdAt: { $gte: startOfMonth, $lt: endOfMonth },
  });

  const totalComputers = await computerModel.countDocuments({
    createdAt: { $gte: startOfMonth, $lt: endOfMonth },
  });

  return totalListings + totalCellPhones + totalComputers;
}

export const getDashboardInfo = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "RestrictedAccess" });
    }

    // ---- Last 6 months data ----
    const months = getLast6Months();
    const chartData = await Promise.all(
      months.map(async (m) => {
        const total = await getTotalListingsByMonth(m.year, m.month);
        return { month: m.name, listings: total };
      })
    );

    // ---- This month ----
    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0, 0, 0, 0);

    const totalListingsThisMonth = await listingModel.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const totalCellPhonesThisMonth =
      await cellPhoneAndTabletsModel.countDocuments({
        createdAt: { $gte: startOfThisMonth },
      });

    const totalComputersThisMonth = await computerModel.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });

    const totalThisMonth =
      totalListingsThisMonth +
      totalCellPhonesThisMonth +
      totalComputersThisMonth;

    // ---- Last month ----
    const startOfLastMonth = new Date(startOfThisMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    const endOfLastMonth = new Date(startOfThisMonth - 1);

    const totalListingsLastMonth = await listingModel.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const totalCellPhonesLastMonth =
      await cellPhoneAndTabletsModel.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      });

    const totalComputersLastMonth = await computerModel.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const totalLastMonth =
      totalListingsLastMonth +
      totalCellPhonesLastMonth +
      totalComputersLastMonth;

    let growth;

    if (totalLastMonth === 0 && totalThisMonth === 0) {
      growth = 0; // no change at all
    } else if (totalLastMonth === 0) {
      // Treat "last month = 0" as growth relative to 1 for consistency
      growth = totalThisMonth * 100; // e.g., 13 → +1300%
    } else if (totalThisMonth === 0) {
      // Treat "this month = 0" as negative growth relative to 1
      growth = -totalLastMonth * 100; // e.g., 13 → -1300%
    } else {
      // Standard percentage change
      growth = ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100;
    }

    // ---- Total items ----
    const totalListings = await listingModel.countDocuments();
    const totalCellPhone = await cellPhoneAndTabletsModel.countDocuments();
    const totalComputers = await computerModel.countDocuments();
    const totalItems = totalListings + totalCellPhone + totalComputers;

    // Helper: get start of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Home Products (example: listingModel)
    const homeProductsCount = await listingModel.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    const cellPhoneCounts = await cellPhoneAndTabletsModel.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    const computersCount = await computerModel.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    const digitalProductsCount = cellPhoneCounts + computersCount;

    const todayProductsData = [
      { name: "Home Products", value: homeProductsCount },
      { name: "Digital Products", value: digitalProductsCount },
    ];

    // deletionResponse
    // Aggregate counts by reason
    const stats = await ListingDeletionModel.aggregate([
      {
        $group: {
          _id: "$reason",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to key:value format
    const result = {};

    // Separate sold and others
    const soldItem = stats.find((item) => item._id.toLowerCase() === "sold");
    const otherItems = stats
      .filter((item) => item._id.toLowerCase() !== "sold")
      .sort((a, b) => a._id.localeCompare(b._id)); // alphabetical sort

    // Add sold first
    if (soldItem) {
      result[soldItem._id] = soldItem.count;
    }

    // Add the rest alphabetically
    otherItems.forEach((item) => {
      result[item._id] = item.count;
    });

    // ---- Response ----
    const responseData = {
      totalListings,
      totalCellPhone,
      totalComputers,
      totalItems,
      growth: growth.toFixed(2),
      totalThisMonth,
      totalLastMonth,
      chartData, // last 6 months
      todayProductsData,
      deletionStats: result,
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};
