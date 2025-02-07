import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { User } from "../auth/auth.model";
import { IOrder } from "./order.interface";
import { Order } from "./order.model";

const createOrder = async (payload: IOrder) => {
  const result = await Order.create(payload);
  return result;
};

const getOrderByProfessional = async (email: string) => {
  try {

    const result = await Order.find({ orderReciver: email })
      .populate("project")
      .populate("transaction");


   
  



    return  result  ;
  } catch (error) {
    console.error("Error fetching orders by professional:", error);
    throw error;
  }
};;
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

  const [client,retireProfessional]=await Promise.all([
    User.find({email:result?.orderReciver}).select("name.firstName name.lastName"),
    User.find({email:result?.orderFrom}).select("name.firstName name.lastName")
  ])

  return {result,client,retireProfessional};
};

const getAllOrders=async () => {
  const result = await Order.find().populate("project").populate("transaction");

 

  return {result};
};
export const OrderService = {
  createOrder,
  getOrderByProfessional,
  getSpecificOrderBYClientAndProfessional,
  getOrderById,
  getOrderByClient,
  getAllOrders
};
