import ApiError from "../../errors/handleApiError";
import { User } from "../auth/auth.model";
import { IOrder } from "./order.interface";
import { Order } from "./order.model";
const createOrder = async (payload: IOrder) => {
  const result = await Order.create(payload);
  return result;
};
const getOrderByProfessional = async (id: string) => {
  try {
    const result = await Order.find({ orderReciver: id })
      .populate("project")
      .populate("transaction")
      .populate("orderFrom")
      .populate("orderReciver");

    return result;
  } catch (error) {
    console.error("Error fetching orders by professional:", error);
    throw error;
  }
};
const getOrderByClient = async (id: string) => {
  const result = await Order.find({ orderFrom: id })
    .populate("project")
    .populate("transaction")
    .populate("orderFrom")
    .populate("orderReciver");
  return result;
};
const getSpecificOrderBYClientAndProfessional = async (
  clientId: string,
  professionalId: string
) => {
  const result = await Order.find({
    orderReciver: professionalId,
    orderFrom: clientId,
  })
    .populate("project")
    .populate("transaction")
    .populate("orderFrom")
    .populate("orderReciver");
  return result;
};
const getOrderById = async (orderId: string) => {
  const result = await Order.findById(orderId)
    .populate("project")
    .populate("transaction")
    .populate("orderFrom")
    .populate("orderReciver");

  return {
    result,
    client: result?.orderFrom,
    retireProfessional: result?.orderReciver,
  };
};
const getAllOrders = async () => {
  const result = await Order.find()
    .populate("project")
    .populate("transaction")
    .populate("orderFrom")
    .populate("orderReciver");
  return { result };
};
const getOrderCalculation = async (
  adminId: string,
  timeframe: "weekly" | "monthly" | "yearly"
) => {
  if (!adminId) {
    throw new ApiError(404, "Owner ID is required.");
  }
  let startDate = new Date();
  let endDate = new Date();
  switch (timeframe) {
    case "weekly":
      startDate.setDate(
        startDate.getDate() -
          (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1)
      );
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case "monthly":
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;

    case "yearly":
      startDate = new Date(startDate.getFullYear(), 0, 1);
      endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      throw new ApiError(
        404,
        "Invalid timeframe. Use weekly, monthly, or yearly."
      );
  }

  const orderData = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              {
                case: { $eq: [timeframe, "weekly"] },
                then: { $dayOfWeek: "$createdAt" },
              },
              {
                case: { $eq: [timeframe, "monthly"] },
                then: { $dayOfMonth: "$createdAt" },
              },
              {
                case: { $eq: [timeframe, "yearly"] },
                then: { $month: "$createdAt" },
              },
            ],
            default: null,
          },
        },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: { $toDouble: "$totalPrice" } },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
  const timeline: Record<string, number> = {};
  orderData.forEach(({ _id, totalOrders }) => {
    if (timeframe === "weekly") {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      timeline[days[_id - 1]] = totalOrders;
    } else if (timeframe === "monthly") {
      timeline[`Day ${_id}`] = totalOrders;
    } else if (timeframe === "yearly") {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      timeline[months[_id - 1]] = totalOrders;
    }
  });

  // Calculate totals
  const totalOrders = orderData.reduce(
    (sum, data) => sum + data.totalOrders,
    0
  );
  const totalRevenue = orderData.reduce(
    (sum, data) => sum + data.totalRevenue,
    0
  );

  return {
    timeframe,
    totalOrders,
    totalRevenue,
    timeline,
  };
};

export const OrderService = {
  createOrder,
  getOrderByProfessional,
  getSpecificOrderBYClientAndProfessional,
  getOrderById,
  getOrderByClient,
  getAllOrders,
  getOrderCalculation,
};
