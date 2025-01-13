import { IOrder } from "./order.interface";
import { Order } from "./order.model";

const createOrder = async (payload: IOrder) => {
  const result = await Order.create(payload);
  return result;
};

const getOrderByProfessional = async (id: string) => {
  const result = await Order.findOne({ orderReciver: id });
  return result;
};

const getSpecificOrderBYClientAndProfessional = async (
  clientId: string,
  professionalId: string
) => {
  const result = await Order.findOne({
    orderReciver: professionalId,
    orderFrom: clientId,
  });
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
