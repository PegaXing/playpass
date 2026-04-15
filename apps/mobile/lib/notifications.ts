// Notifications stub - push notifications disabled for initial build
export const registerForPushNotifications = async (): Promise<string | null> => {
  return null
}

export const sendLocalNotification = async (title: string, body: string) => {
  console.log('Notification:', title, body)
}
