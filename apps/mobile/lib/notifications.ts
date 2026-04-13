import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { router } from 'expo-router'
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert:true, shouldPlaySound:true, shouldSetBadge:true }) })
export async function registerForPushNotifications():Promise<string|null> {
  if (!Device.isDevice) return null
  if (Platform.OS==='android') await Notifications.setNotificationChannelAsync('default',{name:'default',importance:Notifications.AndroidImportance.MAX})
  const {status:existing} = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing!=='granted') { const {status} = await Notifications.requestPermissionsAsync(); finalStatus=status }
  if (finalStatus!=='granted') return null
  try { const {data} = await Notifications.getExpoPushTokenAsync(); return data } catch { return null }
}
export function handleNotificationTap(n:Notifications.Notification, role:'parent'|'child') {
  const data = n.request.content.data as {screen?:string}
  switch(data?.screen) {
    case 'parent_approvals': router.push('/(parent)/approvals'); break
    case 'parent_wallet': router.push('/(parent)/wallet'); break
    case 'child_tasks': router.push('/(child)/tasks'); break
    case 'child_wallet': router.push('/(child)/wallet'); break
    default: role==='parent'?router.push('/(parent)/dashboard'):router.push('/(child)/home')
  }
}