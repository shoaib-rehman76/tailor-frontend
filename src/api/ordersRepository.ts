import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import type { Order, OrderStatus } from "@/src/types/order";

function now() {
  return Date.now();
}

async function readOrders(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.orders);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

export async function seedMockOrdersIfEmpty() {
  const orders = await readOrders();
  if (orders.length > 0) return;

  const basePhone = "03001234567";
  const baseCreated = now() - 1000 * 60 * 60 * 24 * 5;

  const seed: Order[] = [
    {
      id: nanoid(),
      orderNo: "1001",
      createdAt: baseCreated,
      updatedAt: baseCreated,
      customer: { name: "Ahmed", phone: basePhone },
      status: "PENDING",
      deliveryDate: now() + 1000 * 60 * 60 * 24 * 2,
      garments: [],
      fabricPhotoUris: [],
      price: 4500,
      advance: 1500,
      payments: [{ id: nanoid(), amount: 1500, paidAt: baseCreated }],
    },
    {
      id: nanoid(),
      orderNo: "1002",
      createdAt: baseCreated + 1000 * 60 * 60,
      updatedAt: baseCreated + 1000 * 60 * 60,
      customer: { name: "Bilal", phone: "03111222333" },
      status: "STITCHING",
      deliveryDate: now() + 1000 * 60 * 60 * 24 * 1,
      garments: [],
      fabricPhotoUris: [],
      price: 6000,
      advance: 2000,
      payments: [{ id: nanoid(), amount: 2000, paidAt: baseCreated + 1000 * 60 * 60 }],
    }
  ];

  await writeOrders(seed);
}

export async function listOrders(): Promise<Order[]> {
  const orders = await readOrders();
  return orders.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await readOrders();
  return orders.find((o) => o.id === id);
}

export async function listOrdersByCustomerPhone(phone: string): Promise<Order[]> {
  const orders = await readOrders();
  return orders
    .filter((o) => o.customer.phone === phone)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function searchOrdersLocal(q: string): Promise<Order[]> {
  const query = q.trim().toLowerCase();
  if (!query) return listOrders();
  const orders = await readOrders();
  return orders.filter((o) => {
    const fields = [
      o.customer.name,
      o.customer.phone,
      o.orderNo,
      o.status,
    ]
      .join(" ")
      .toLowerCase();
    return fields.includes(query);
  });
}

export async function createOrderLocal(
  draft: Omit<Order, "id" | "orderNo" | "createdAt" | "updatedAt">
): Promise<Order> {
  const orders = await readOrders();
  const maxNo = orders.reduce((acc, o) => Math.max(acc, Number(o.orderNo) || 0), 1000);
  const createdAt = now();
  const order: Order = {
    ...draft,
    id: nanoid(),
    orderNo: String(maxNo + 1),
    createdAt,
    updatedAt: createdAt,
  };
  orders.push(order);
  await writeOrders(orders);
  return order;
}

export async function updateOrderStatusLocal(
  id: string,
  status: OrderStatus
): Promise<Order | undefined> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  orders[idx] = { ...orders[idx], status, updatedAt: now() };
  await writeOrders(orders);
  return orders[idx];
}

export async function addPaymentLocal(
  id: string,
  amount: number
): Promise<Order | undefined> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  const payment = { id: nanoid(), amount, paidAt: now() };
  const current = orders[idx];
  const nextAdvance = (current.advance || 0) + amount;
  orders[idx] = {
    ...current,
    advance: nextAdvance,
    payments: [...(current.payments ?? []), payment],
    updatedAt: now(),
  };
  await writeOrders(orders);
  return orders[idx];
}

export async function markOrderSyncedLocal(
  id: string,
  syncedAt: number = now()
): Promise<Order | undefined> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  orders[idx] = { ...orders[idx], syncedAt, updatedAt: now() };
  await writeOrders(orders);
  return orders[idx];
}

