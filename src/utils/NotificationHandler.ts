import * as Notifications from "expo-notifications";

export const NotificaionsHandler = async() => {

    Notifications.setNotificationHandler({
      handleNotification:
        async (): Promise<Notifications.NotificationBehavior> => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
    });
} 
