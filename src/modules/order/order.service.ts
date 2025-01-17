import { IOrder } from "./order.interface";
import { Order } from "./order.model";

const createOrder = async (payload: IOrder) => {
  const result = await Order.create(payload);
  return result;
};

const getOrderByProfessional = async (email: string) => {
  const result = await Order.findOne({ orderReciver: email }).populate("project");
  return result;
};

const getSpecificOrderBYClientAndProfessional = async (
  clientId: string,
  professionalId: string
) => {
  const result = await Order.find({
    orderReciver: professionalId,
    orderFrom: clientId,
  }).populate("project");
  return result;
};
const getOrderById = async (orderId: string) => {
  const result = await Order.findById(orderId);

  return result;
};
export const OrderService = {
  createOrder,
  getOrderByProfessional,
  getSpecificOrderBYClientAndProfessional,
  getOrderById,
};
