import mongoose from "mongoose";
import { ListingDeletionModel } from "../../Models/Deletions/ListingsDeletions.js";
import { NotificationModel } from "../../Models/Notification/NotificationModel.js";
import { cellPhoneAndTabletsModel } from "../../Models/Products/cellPhoneAndTabletsModel.js";
import { computerModel } from "../../Models/Products/computerModel.js";
import { listingModel } from "../../Models/Products/listingModel.js";
import {
  cellPhoneAndTablets,
  computer,
  digitalEquipment,
  estate,
} from "../../Utility/constants.js";
import { onlineUsers } from "../../server.js";
import { userModel } from "../../Models/User/userModel.js";

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

export const getListingsStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });
    }

    // Approved
    const approvedListings = await listingModel.countDocuments({
      isApproved: true,
    });
    const approvedCell = await cellPhoneAndTabletsModel.countDocuments({
      isApproved: true,
    });
    const approvedComputers = await computerModel.countDocuments({
      isApproved: true,
    });
    const totalApproved = approvedListings + approvedCell + approvedComputers;

    // Rejected
    const rejectedListings = await listingModel.countDocuments({
      isRejected: true,
    });
    const rejectedCell = await cellPhoneAndTabletsModel.countDocuments({
      isRejected: true,
    });
    const rejectedComputers = await computerModel.countDocuments({
      isRejected: true,
    });
    const totalRejected = rejectedListings + rejectedCell + rejectedComputers;

    // Pending
    const pendingListings = await listingModel.countDocuments({
      isApproved: false,
      isRejected: false,
      isDeleted: false,
    });
    const pendingCell = await cellPhoneAndTabletsModel.countDocuments({
      isApproved: false,
      isRejected: false,
      isDeleted: false,
    });
    const pendingComputers = await computerModel.countDocuments({
      isApproved: false,
      isRejected: false,
      isDeleted: false,
    });
    const totalPending = pendingListings + pendingCell + pendingComputers;

    const totalOfUsers = await userModel.countDocuments({
      role: "User",
    });

    const totalOfAdmins = await userModel.countDocuments({
      role: "Admin",
    });

    return res.status(200).json({
      success: true,
      data: {
        approved: totalApproved,
        rejected: totalRejected,
        pending: totalPending,
        totalOfUsers,
        totalOfAdmins,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

//Returns paginated pending listings from all three models
export const getPendingListings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false, isApproved: false, isRejected: false };

    // Fetch all pending items from all models
    const [listings, cellPhones, computers] = await Promise.all([
      listingModel.find(filter),
      cellPhoneAndTabletsModel.find(filter),
      computerModel.find(filter),
    ]);

    // Combine and sort by creation date descending
    const allItems = [...listings, ...cellPhones, ...computers].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Slice according to page & limit
    const items = allItems.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        items,
        totalPages,
        currentPage: page,
        totalItems,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Returns paginated approved listings from all three models
export const getApprovedListings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false, isApproved: true };

    const [listings, cellPhones, computers] = await Promise.all([
      listingModel.find(filter),
      cellPhoneAndTabletsModel.find(filter),
      computerModel.find(filter),
    ]);

    const allItems = [...listings, ...cellPhones, ...computers].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt) // newest first
    );

    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const items = allItems.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        items,
        totalPages,
        currentPage: page,
        totalItems,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Returns paginated rejected listings from all three models
export const getRejectedListings = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false, isRejected: true };

    const [listings, cellPhones, computers] = await Promise.all([
      listingModel.find(filter),
      cellPhoneAndTabletsModel.find(filter),
      computerModel.find(filter),
    ]);

    const allItems = [...listings, ...cellPhones, ...computers].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const items = allItems.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        items,
        totalPages,
        currentPage: page,
        totalItems,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get a single listing to be checked by admin for approval
export const getListingByIdForApproval = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });
    }
    const params = req.params.id.split(",");
    const id = params[0];
    const mainCategory = params[1]?.toLowerCase();
    const subCategory = params[2]?.toLowerCase();

    let product = null;
    switch (mainCategory) {
      case estate: {
        product = await listingModel.findOne({
          _id: id,
          isDeleted: false,
        });
        break;
      }
      case digitalEquipment.toLowerCase(): {
        switch (subCategory) {
          case cellPhoneAndTablets: {
            product = await cellPhoneAndTabletsModel.findOne({
              _id: id,
              isDeleted: false,
            });

            break;
          }
          case computer: {
            product = await computerModel.findOne({
              _id: id,
              isDeleted: false,
            });
            break;
          }
        }
        break;
      }
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Listing Not Found",
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// approve listings by admin
export const approveListing = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (req.user.role !== "Admin")
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });

    const { id, mainCategory, subCategory } = req.query;
    if (!id || !mainCategory)
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters" });

    let product = null;

    switch (mainCategory) {
      case estate:
        product = await listingModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { isApproved: true, isRejected: false, RejectedReason: "" },
          { new: true, session }
        );
        break;
      case digitalEquipment:
        switch (subCategory) {
          case cellPhoneAndTablets:
            product = await cellPhoneAndTabletsModel.findOneAndUpdate(
              { _id: id, isDeleted: false },
              { isApproved: true, isRejected: false, RejectedReason: "" },
              { new: true, session }
            );
            break;
          case computer:
            product = await computerModel.findOneAndUpdate(
              { _id: id, isDeleted: false },
              { isApproved: true, isRejected: false, RejectedReason: "" },
              { new: true, session }
            );
            break;
        }
        break;
    }

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ success: false, message: "Listing Not Found" });
    }

    // Create notification in DB
    const [notification] = await NotificationModel.create(
      [
        {
          userId: product.userRef,
          title: "Listing Approved ✅",
          message: `Your listing "${product.name}" has been approved by the admin.`,
          isRead: false,
        },
      ],
      { session }
    );

    // Send notification via WebSocket if user is online
    const socket = onlineUsers.get(product.userRef.toString());
    if (socket) {
      socket.emit("notification", notification);
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Listing approved successfully",
      data: product,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// reject listings by admin
export const rejectListing = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });
    }

    const { id, mainCategory, subCategory } = req.query;
    const { reason } = req.body;

    if (!id || !mainCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters" });
    }

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Rejection reason is required" });
    }

    let product = null;

    switch (mainCategory) {
      case estate: {
        product = await listingModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { isApproved: false, isRejected: true, RejectedReason: reason },
          { new: true, session }
        );
        break;
      }
      case digitalEquipment: {
        switch (subCategory) {
          case cellPhoneAndTablets: {
            product = await cellPhoneAndTabletsModel.findOneAndUpdate(
              { _id: id, isDeleted: false },
              { isApproved: false, isRejected: true, RejectedReason: reason },
              { new: true, session }
            );
            break;
          }
          case computer: {
            product = await computerModel.findOneAndUpdate(
              { _id: id, isDeleted: false },
              { isApproved: false, isRejected: true, RejectedReason: reason },
              { new: true, session }
            );
            break;
          }
        }
        break;
      }
    }

    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Listing Not Found",
      });
    }

    // Create notification in DB
    const [notification] = await NotificationModel.create(
      [
        {
          userId: product.userRef, // match approveListing
          title: "Listing Rejected ❌",
          message: `Your listing "${product.name}" has been rejected by the admin. Note: Check Your Listings page in app for more info`,
          isRead: false,
        },
      ],
      { session }
    );

    // Send notification via WebSocket if user is online
    const socket = onlineUsers.get(product.userRef.toString());
    if (socket) {
      socket.emit("notification", notification);
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Listing rejected successfully",
      data: product,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ success: false, message: "Restricted Access" });
    }

    const productId = req.params.id;

    const listings = [];

    const estate = await listingModel.findById(productId);

    if (estate != null) {
      listings.push(estate);
    }

    const cellPhone = await cellPhoneAndTabletsModel.findById(productId);

    if (cellPhone != null) {
      listings.push(cellPhone);
    }

    const computer = await computerModel.findById(productId);

    if (computer != null) {
      listings.push(computer);
    }

    return res.status(200).json({
      success: true,
      data: listings,
    });
  } catch (error) {
    // If it's an invalid ObjectId (CastError)
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
