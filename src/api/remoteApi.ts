import axiosInstance from "@/src/utils/axiosInstance";
import type { Order, OrderStatus } from "@/src/types/order";

/** Maps frontend Order to the shape expected by the backend POST /api/order */
function toBackendOrderPayload(order: Order) {
  return {
    orderNo: order.orderNo,
    deviceToken: order.deviceToken,
    customer_name: order.customer.name,
    customer_phone: order.customer.phone,
    garments: order.garments ?? [],
    notes: order.notes ?? "",
    delivery_date: new Date(order.deliveryDate).toISOString(),
    price: order.price,
    advance: order.advance,
    payments: order.payments ?? [],
    status: order.status,
  };
}

/** Maps a backend order document to the frontend Order type */
function fromBackendOrder(doc: any): Order {
  return {
    id: doc._id ?? doc.id,
    orderNo: doc.orderNo ?? "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now(),
    customer: {
      name: doc.customer_name,
      phone: doc.customer_phone,
    },
    status: doc.status ?? "PENDING",
    deliveryDate: new Date(doc.delivery_date).getTime(),
    garments: doc.garments ?? [],
    notes: doc.notes || undefined,
    fabricPhotoUris: doc.fabricPhotoUris ?? [],
    price: doc.price,
    advance: doc.advance,
    payments: doc.payments ?? [],
    deviceToken: doc.deviceToken || undefined,
    syncedAt: Date.now(),
  };
}

export const remoteApi = {
  async fetchOrders(): Promise<Order[]> {
    const { data } = await axiosInstance.get("/order");
    return (data as any[]).map(fromBackendOrder);
  },
  async createOrder(order: Order) {
    const payload = toBackendOrderPayload(order);
    const { data } = await axiosInstance.post("/order", payload);
    return { ok: true as const, remoteId: data._id ?? data.id };
  },
  async updateOrder(order: Order) {
    const payload = toBackendOrderPayload(order);
    const { data } = await axiosInstance.put(`/order/${order.id}`, payload);
    const updatedOrder = data?.body ?? data?.order ?? data;
    return {
      ok: true as const,
      order: updatedOrder ? fromBackendOrder(updatedOrder) : undefined,
    };
  },
  async updateOrderStatus(id: string, status: OrderStatus) {
    const { data } = await axiosInstance.put(`/order/update/${id}`, { status });
    const order = data?.body ?? data?.order ?? data;
    return {
      ok: true as const,
      order: order ? fromBackendOrder(order) : undefined,
    };
  },
  async deleteOrder(id: string) {
    await axiosInstance.delete(`/order/${id}`);
    return { ok: true as const, id };
  },
};
