import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../../../lib/auth-context'
import { db } from '../../../lib/supabase'
import { Colors, Typography, Spacing, Radius } from '../../../constants/design'

const TEMPLATES = [
  { title: 'Finish Homework', reward: 30, icon: '📚' }, { title: 'Make Your Bed', reward: 10, icon: '🛏️' },
  { title: 'Tidy Your Room', reward: 20, icon: '🧹' }, { title: 'Take Out the Bins', reward: 15, icon: '🗑️' },
  { title: 'Wash the Dishes', reward: 20, icon: '🍽️' }, { title: 'Feed the Pet', reward: 10, icon: '🐾' },
  { title: 'Practice Instrument', reward: 30, icon: '🎵' }, { title: 'Read for 20 mins', reward: 20, icon: '📖' },
]
const REWARDS = [5, 10, 15, 20, 30, 45, 60]
const PATTERNS = [{ label: 'Every day', value: 'daily' }, { label: 'Weekdays only', value: 'weekdays' }, { label: 'Once a week', value: 'weekly' }]

export default function CreateTask() {
  const { user, family } = useAuth()
  const [title, setTitle] = useState(''), [description, setDescription] = useState('')
  const [rewardMins, setRewardMins] = useState(15), [isRecurring, setIsRecurring] = useState(true)
  const [pattern, setPattern] = useState('daily'), [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [children, setChildren] = useState<any[]>([]), [loading, setLoading] = useState(false)

  useEffect(() => {
    if (family?.id) db.getChildrenInFamily(family.id).then(({ data }) => {
      if (data) { setChildren(data); if (data.length === 1) setAssignedTo(data[0].user_id) }
    })
  }, [family?.id])

  const create = async () => {
    if (title.trim().length < 3) { Alert.alert('Check details', 'Mission name needs at least 3 characters.'); return }
    if (!assignedTo) { Alert.alert('Check details', 'Please select a player.'); return }
    setLoading(true)
    const { error } = await db.createTask({ family_id: family!.id, created_by: user!.id, assigned_to: assignedTo, title: title.trim(), reward_mins: rewardMins, is_recurring: isRecurring, recurrence_pattern: isRecurring ? pattern : undefined })
    setLoading(false)
    if (error) { Alert.alert('Error', 'Could not create mission.'); return }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.back()
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.topTitle}>New Mission</Text>
          <TouchableOpacity onPress={create} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={Colors.indigoLight} /> : <Text style={s.save}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={s.sectionLabel}>Quick templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
            {TEMPLATES.map(t => (
              <TouchableOpacity key={t.title} style={[s.chip, title === t.title && s.chipActive]} onPress={() => { setTitle(t.title); setRewardMins(t.reward); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}>
                <Text style={{ fontSize: 14 }}>{t.icon}</Text>
                <Text style={[s.chipText, title === t.title && s.chipTextActive]}>{t.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.field}>
            <Text style={s.label}>Mission name *</Text>
            <TextInput style={s.input} placeholder="e.g. Make your bed" placeholderTextColor={Colors.text3} value={title} onChangeText={setTitle} autoCapitalize="sentences" />
          </View>
          <View style={s.field}>
            <Text style={s.label}>Pass Time reward — {rewardMins} minutes</Text>
            <View style={s.rewardRow}>
              {REWARDS.map(r => (
                <TouchableOpacity key={r} style={[s.chip, rewardMins === r && s.chipActive]} onPress={() => { setRewardMins(r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}>
                  <Text style={[s.chipText, rewardMins === r && s.chipTextActive]}>{r}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.field}>
            <Text style={s.label}>Frequency</Text>
            <View style={s.toggle}>
              <TouchableOpacity style={[s.toggleOpt, !isRecurring && s.toggleOptActive]} onPress={() => setIsRecurring(false)}><Text style={[s.toggleText, !isRecurring && s.toggleTextActive]}>One-off</Text></TouchableOpacity>
              <TouchableOpacity style={[s.toggleOpt, isRecurring && s.toggleOptActive]} onPress={() => setIsRecurring(true)}><Text style={[s.toggleText, isRecurring && s.toggleTextActive]}>Recurring</Text></TouchableOpacity>
            </View>
            {isRecurring && (
              <View style={s.rewardRow}>
                {PATTERNS.map(p => (
                  <TouchableOpacity key={p.value} style={[s.chip, pattern === p.value && s.chipActive]} onPress={() => setPattern(p.value)}>
                    <Text style={[s.chipText, pattern === p.value && s.chipTextActive]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {children.length > 0 && (
            <View style={s.field}>
              <Text style={s.label}>Assign to *</Text>
              <View style={s.rewardRow}>
                {children.map((child: any) => (
                  <TouchableOpacity key={child.user_id} style={[s.playerOpt, assignedTo === child.user_id && s.playerOptActive]} onPress={() => setAssignedTo(child.user_id)}>
                    <View style={[s.playerAvatar, assignedTo === child.user_id && { backgroundColor: Colors.indigoDim2 }]}>
                      <Text style={[s.playerAvatarText, assignedTo === child.user_id && { color: Colors.indigoLight }]}>{child.user?.display_name?.charAt(0)}</Text>
                    </View>
                    <Text style={[s.playerName, assignedTo === child.user_id && { color: Colors.indigoLight, fontFamily: Typography.family.bold }]}>{child.user?.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},topBar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.xl,paddingVertical:Spacing.base},
  cancel:{fontFamily:Typography.family.medium,fontSize:Typography.size.base,color:Colors.text2},topTitle:{fontFamily:Typography.family.bold,fontSize:Typography.size.md,color:Colors.text},
  save:{fontFamily:Typography.family.bold,fontSize:Typography.size.base,color:Colors.indigoLight},content:{paddingHorizontal:Spacing.xl,paddingBottom:Spacing['4xl'],gap:Spacing.lg},
  sectionLabel:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.xs,color:Colors.text3,textTransform:'uppercase',letterSpacing:0.6},field:{gap:Spacing.sm},
  label:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.xs,color:Colors.text3,textTransform:'uppercase',letterSpacing:0.5},
  input:{backgroundColor:Colors.card2,borderRadius:Radius.md,borderWidth:1.5,borderColor:Colors.border2,paddingHorizontal:Spacing.base,height:52,fontFamily:Typography.family.regular,fontSize:Typography.size.base,color:Colors.text},
  chip:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:Spacing.md,paddingVertical:Spacing.sm,backgroundColor:Colors.card,borderRadius:999,borderWidth:1.5,borderColor:Colors.border},
  chipActive:{borderColor:Colors.indigo,backgroundColor:Colors.indigoDim},chipText:{fontFamily:Typography.family.medium,fontSize:Typography.size.sm,color:Colors.text2},
  chipTextActive:{color:Colors.indigoLight,fontFamily:Typography.family.bold},rewardRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  toggle:{flexDirection:'row',backgroundColor:Colors.card2,borderRadius:Radius.lg,padding:3},toggleOpt:{flex:1,paddingVertical:Spacing.sm,borderRadius:Radius.md,alignItems:'center'},
  toggleOptActive:{backgroundColor:Colors.card},toggleText:{fontFamily:Typography.family.medium,fontSize:Typography.size.base,color:Colors.text3},
  toggleTextActive:{fontFamily:Typography.family.bold,color:Colors.text},
  playerOpt:{alignItems:'center',gap:Spacing.sm,padding:Spacing.md,backgroundColor:Colors.card,borderRadius:Radius.lg,borderWidth:1.5,borderColor:Colors.border,minWidth:90},
  playerOptActive:{borderColor:Colors.indigo,backgroundColor:Colors.indigoDim},playerAvatar:{width:44,height:44,borderRadius:22,backgroundColor:Colors.card2,alignItems:'center',justifyContent:'center'},
  playerAvatarText:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.lg,color:Colors.text2},playerName:{fontFamily:Typography.family.medium,fontSize:Typography.size.sm,color:Colors.text2},
})