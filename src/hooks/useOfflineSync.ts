import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import i18n from "@/src/i18n";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { dequeue, markTryFailed } from "@/src/store/slices/offlineQueueSlice";
import {
  setLastSyncAt,
  setSyncError,
  setSyncing,
} from "@/src/store/slices/syncStatusSlice";
import { remoteApi } from "@/src/api/remoteApi";
import {
  markOrderSyncedLocal,
  removeOrderLocal,
} from "@/src/api/ordersRepository";

export function useOfflineSync() {
  const dispatch = useAppDispatch();
  const queue = useAppSelector((s) => s.offlineQueue.items);
  const { isSyncing, syncRequestNonce } = useAppSelector((s) => s.syncStatus);
  const onlineRef = useRef<boolean>(true);
  const lastOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      onlineRef.current = !!state.isConnected;
      lastOfflineRef.current = !onlineRef.current;
    });
    return () => sub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (isSyncing) return;
      if (!onlineRef.current) return;
      if (queue.length === 0) return;

      dispatch(setSyncing(true));
      dispatch(setSyncError(undefined));
      let syncedCount = 0;
      try {
        for (const item of queue) {
          if (cancelled) return;
          try {
            if (item.type === "orders/create") {
              const order = item.payload as { id: string };
              await remoteApi.createOrder(item.payload as any);
              await removeOrderLocal(order.id);
              dispatch(dequeue({ id: item.id }));
              syncedCount += 1;
            } else if (item.type === "orders/update") {
              const { id, status } = item.payload as any;
              await remoteApi.updateOrderStatus(id, status);
              await markOrderSyncedLocal(id);
              dispatch(dequeue({ id: item.id }));
              syncedCount += 1;
            } else if (item.type === "orders/updateOrder") {
              await remoteApi.updateOrder(item.payload as any);
              dispatch(dequeue({ id: item.id }));
              syncedCount += 1;
            } else if (item.type === "orders/addPayment") {
              await remoteApi.updateOrder(item.payload as any);
              dispatch(dequeue({ id: item.id }));
              syncedCount += 1;
            } else if (item.type === "orders/delete") {
              const { id } = item.payload as { id: string };
              await remoteApi.deleteOrder(id);
              dispatch(dequeue({ id: item.id }));
              syncedCount += 1;
            } else {
              // Unknown/unsupported op for now; keep it.
              dispatch(
                markTryFailed({
                  id: item.id,
                  error: "Unsupported operation",
                })
              );
              break;
            }
          } catch (e) {
            dispatch(
              markTryFailed({
                id: item.id,
                error: e instanceof Error ? e.message : "Sync error",
              })
            );
            dispatch(
              setSyncError(e instanceof Error ? e.message : "Sync error"),
            );
            break;
          }
        }
        dispatch(setLastSyncAt(Date.now()));
        if (syncedCount > 0) {
          Alert.alert(i18n.t("sync.title"), i18n.t("sync.success"));
        }
      } finally {
        dispatch(setSyncing(false));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [queue, dispatch, isSyncing, syncRequestNonce]);
}
