import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography, Radius } from '../../constants/design'

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24, paddingBottom: 32 }}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 48 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 48 }}>🎮</Text>
          <Text style={{ fontFamily: Typography.family.extraBold, fontSize: 36, color: Colors.text, textAlign: 'center' }}>PlayPass</Text>
          <Text style={{ fontFamily: Typography.family.medium, fontSize: 16, color: Colors.text2, textAlign: 'center', lineHeight: 24 }}>
            Less arguing. More earning.
          </Text>
        </View>
        <View style={{ gap: 16 }}>
          {[
            { icon: '🎯', title: 'Earn Pass Time', sub: 'Complete missions to unlock gaming' },
            { icon: '🎮', title: 'Xbox tracking', sub: 'Gaming time auto-deducted every 15 mins' },
            { icon: '🏆', title: 'Streaks and Unlocks', sub: 'Milestones, badges and bonus Pass Time' },
          ].map(f => (
            <View key={f.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontSize: 24 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Typography.family.bold, fontSize: 14, color: Colors.text, marginBottom: 2 }}>{f.title}</Text>
                <Text style={{ fontFamily: Typography.family.regular, fontSize: 12, color: Colors.text2 }}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            style={{ height: 54, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.indigo }}>
            <Text style={{ fontFamily: Typography.family.extraBold, fontSize: 17, color: '#fff' }}>Get started as a parent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border2 }}
            onPress={() => router.push('/(auth)/join')}>
            <Text style={{ fontFamily: Typography.family.bold, fontSize: 15, color: Colors.text }}>I have an invite code</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={{ fontFamily: Typography.family.medium, fontSize: 13, color: Colors.text3, textAlign: 'center', padding: 8 }}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}