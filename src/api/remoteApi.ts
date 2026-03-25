import axiosInstance from "@/src/utils/axiosInstance";
import type { Order, OrderStatus } from "@/src/types/order";

/** Maps frontend Order to the shape expected by the backend POST /api/order */
function toBackendOrderPayload(order: Order) {
  return {
    customer_name: order.customer.name,
    customer_phone: order.customer.phone,
    garments: order.garments ?? [],
    notes: order.notes ?? "",
    delivery_date: new Date(order.deliveryDate).toISOString(),
    price: order.price,
    advance: order.advance,
    payments: order.payments ?? [],
  };
}

export const remoteApi = {
  async createOrder(order: Order) {
    const payload = toBackendOrderPayload(order);
    const { data } = await axiosInstance.post("/order", payload);
    return { ok: true as const, remoteId: data._id ?? data.id };
  },
  async updateOrderStatus(_id: string, status: OrderStatus) {
    // TODO: implement when backend has PATCH /order/:id/status
    return { ok: true as const, id: _id, status };
  },
};
