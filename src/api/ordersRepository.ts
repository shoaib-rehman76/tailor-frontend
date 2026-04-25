import { STORAGE_KEYS } from "@/src/constants/storageKeys";
import type { Order, OrderStatus } from "@/src/types/order";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "@reduxjs/toolkit";
import { getCurrentUserId, toScopedStorageKey } from "@/src/utils/storageScope";

function now() {
  return Date.now();
}

function generateOrderNo(existingOrders: Order[]) {
  while (true) {
    const candidate = `ORD-${nanoid(8).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()}`;
    if (!existingOrders.some((order) => order.orderNo === candidate)) {
      return candidate;
    }
  }
}

async function readOrders(): Promise<Order[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const raw = await AsyncStorage.getItem(
    toScopedStorageKey(STORAGE_KEYS.orders, userId),
  );
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]) {
  const userId = getCurrentUserId();
  if (!userId) return;
  await AsyncStorage.setItem(
    toScopedStorageKey(STORAGE_KEYS.orders, userId),
    JSON.stringify(orders),
  );
}

export async function listOrders(): Promise<Order[]> {
  const orders = await readOrders();
  return orders.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await readOrders();
  return orders.find((o) => o.id === id);
}

export async function listOrdersByCustomerPhone(
  phone: string,
): Promise<Order[]> {
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
    const fields = [o.customer.name, o.customer.phone, o.orderNo, o.status]
      .join(" ")
      .toLowerCase();
    return fields.includes(query);
  });
}

export async function createOrderLocal(
  draft: Omit<Order, "id" | "orderNo" | "createdAt" | "updatedAt">,
): Promise<Order> {
  const orders = await readOrders();
  const createdAt = now();
  const order: Order = {
    ...draft,
    id: nanoid(),
    orderNo: generateOrderNo(orders),
    createdAt,
    updatedAt: createdAt,
  };
  orders.push(order);
  await writeOrders(orders);
  return order;
}

export async function updateOrderStatusLocal(
  id: string,
  status: OrderStatus,
): Promise<Order | undefined> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  orders[idx] = { ...orders[idx], status, updatedAt: now() };
  await writeOrders(orders);
  return orders[idx];
}

export async function updateOrderLocal(
  id: string,
  updates: Omit<Order, "id" | "orderNo" | "createdAt" | "updatedAt">,
): Promise<Order | undefined> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  orders[idx] = {
    ...orders[idx],
    ...updates,
    id: orders[idx].id,
    orderNo: orders[idx].orderNo,
    createdAt: orders[idx].createdAt,
    updatedAt: now(),
  };
  await writeOrders(orders);
  return orders[idx];
}

export async function upsertOrderLocal(order: Order): Promise<Order> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === order.id);
  const nextOrder = {
    ...order,
    updatedAt: now(),
  };

  if (idx === -1) {
    orders.push(nextOrder);
  } else {
    orders[idx] = nextOrder;
  }

  await writeOrders(orders);
  return nextOrder;
}

export async function addPaymentLocal(
  id: string,
  amount: number,
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

export async function removeOrderLocal(id: string): Promise<void> {
  const orders = await readOrders();
  const filtered = orders.filter((o) => o.id !== id);
  await writeOrders(filtered);
}

export async function markOrderSyncedLocal(
  id: string,
  syncedAt: number = now(),
): Promise<Order | undefined> {
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  orders[idx] = { ...orders[idx], syncedAt, updatedAt: now() };
  await writeOrders(orders);
  return orders[idx];
}
