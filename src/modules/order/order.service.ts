import { IOrder } from "./order.interface";
import { Order } from "./order.model";

const createOrder = async (payload: IOrder) => {
  const result = await Order.create(payload);
  return result;
};

const getOrderByProfessional = async (email: string) => {
  const result = await Order.find({ orderReciver: email }).populate("project").populate("transaction");
  return result;
};
const getOrderByClient= async (email: string) => {
  const result = await Order.find({ orderFrom: email }).populate("project").populate("transaction");
  return result;
};

const getSpecificOrderBYClientAndProfessional = async (
  clientId: string,
  professionalId: string
) => {
  const result = await Order.find({
    orderReciver: professionalId,
    orderFrom: clientId,
  }).populate("project").populate("transaction");
  return result;
};
const getOrderById = async (orderId: string) => {
  const result = await Order.findById(orderId).populate("project").populate("transaction");

  return result;
};
export const OrderService = {
  createOrder,
  getOrderByProfessional,
  getSpecificOrderBYClientAndProfessional,
  getOrderById,
  getOrderByClient
};
