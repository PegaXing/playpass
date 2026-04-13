import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, ActivityIndicator, Alert, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useAuth } from '../../lib/auth-context'
import { supabase, db } from '../../lib/supabase'
import { Colors, Typography, Spacing, Radius } from '../../constants/design'

const timeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago` }
const fmt = (m: number) => { const h = Math.floor(m/60), min = m%60; return h > 0 ? (min > 0 ? `${h}h ${min}m` : `${h}h`) : `${m}m` }

export default function Approvals() {
  const { user, family } = useAuth()
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ visible: boolean; id: string | null; reason: string }>({ visible: false, id: null, reason: '' })
  const [proofUrl, setProofUrl] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!family?.id) return
    const { data } = await db.getPendingCompletions(family.id)
    if (data) setPending(data)
  }, [family?.id])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])
  useEffect(() => {
    if (!family?.id) return
    const ch = supabase.channel('approvals').on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions', filter: `family_id=eq.${family.id}` }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [family?.id, load])

  const approve = async (c: any) => {
    if (!user?.id) return
    setProcessingId(c.id)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    const { error } = await db.approveCompletion(c.id, user.id)
    setProcessingId(null)
    if (error) { Alert.alert('Error', 'Could not approve. Try again.'); return }
    setPending(p => p.filter(x => x.id !== c.id))
  }

  const confirmReject = async () => {
    if (!user?.id || !rejectModal.id) return
    const id = rejectModal.id
    setProcessingId(id)
    setRejectModal(r => ({ ...r, visible: false }))
    await db.rejectCompletion(id, user.id, rejectModal.reason || undefined)
    setProcessingId(null)
    setPending(p => p.filter(x => x.id !== id))
    setRejectModal({ visible: false, id: null, reason: '' })
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.indigo} size="large" /></View>

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Approve Missions</Text>
        {pending.length > 0 && <View style={s.badge}><Text style={s.badgeText}>{pending.length}</Text></View>}
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} tintColor={Colors.indigo} />}>
        {pending.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🎉</Text>
            <Text style={s.emptyTitle}>All caught up!</Text>
            <Text style={s.emptySub}>No missions waiting for approval right now.</Text>
          </View>
        ) : pending.map(c => (
          <View key={c.id} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.avatar}><Text style={s.avatarText}>{c.child?.display_name?.charAt(0) ?? '?'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.taskName}>{c.task?.title}</Text>
                <Text style={s.meta}>{c.child?.display_name} · {timeAgo(c.submitted_at)}</Text>
              </View>
              <View style={s.rewardBadge}><Text style={s.rewardText}>+{fmt(c.reward_mins)}</Text></View>
            </View>
            {c.proof_image_url && (
              <TouchableOpacity style={s.proofBtn} onPress={() => setProofUrl(c.proof_image_url)}>
                <Text style={{ fontSize: 16 }}>📷</Text>
                <Text style={s.proofBtnText}>View photo proof</Text>
              </TouchableOpacity>
            )}
            <Text style={s.question}>Grant Pass Time Reward?</Text>
            <View style={s.actionRow}>
              <TouchableOpacity style={s.denyBtn} onPress={() => setRejectModal({ visible: true, id: c.id, reason: '' })} disabled={processingId === c.id}>
                <Text style={s.denyText}>✕ Deny</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.approveBtn, processingId === c.id && { opacity: 0.5 }]} onPress={() => approve(c)} disabled={processingId === c.id}>
                {processingId === c.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.approveText}>✓ Approve +{fmt(c.reward_mins)}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <Modal visible={rejectModal.visible} transparent animationType="slide" onRequestClose={() => setRejectModal(r => ({ ...r, visible: false }))}>
        <View style={s.overlay}><View style={s.sheet}><View style={s.handle} />
          <Text style={s.sheetTitle}>Send feedback</Text>
          <Text style={s.sheetSub}>Tell your player what needs to be done differently (optional).</Text>
          <TextInput style={s.input} placeholder="e.g. Please try again more carefully" placeholderTextColor={Colors.text3} value={rejectModal.reason} onChangeText={reason => setRejectModal(r => ({ ...r, reason }))} multiline numberOfLines={3} textAlignVertical="top" />
          <View style={s.actionRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setRejectModal(r => ({ ...r, visible: false }))}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.denyBtn2} onPress={confirmReject}><Text style={s.denyText2}>Send back</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
      <Modal visible={!!proofUrl} transparent animationType="fade" onRequestClose={() => setProofUrl(null)}>
        <TouchableOpacity style={s.proofOverlay} activeOpacity={1} onPress={() => setProofUrl(null)}>
          {proofUrl && <Image source={{ uri: proofUrl }} style={s.proofImage} resizeMode="contain" />}
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: Typography.family.medium, fontSize: Typography.size.sm, marginTop: 24 }}>Tap anywhere to close</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},center:{flex:1,backgroundColor:Colors.bg,alignItems:'center',justifyContent:'center'},
  header:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:Spacing.xl,paddingTop:Spacing.xl,paddingBottom:Spacing.base},
  title:{fontFamily:Typography.family.extraBold,fontSize:Typography.size['2xl'],color:Colors.text},
  badge:{backgroundColor:Colors.amber,borderRadius:999,minWidth:24,height:24,paddingHorizontal:6,alignItems:'center',justifyContent:'center'},
  badgeText:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.sm,color:'#fff'},
  content:{paddingHorizontal:Spacing.xl,paddingBottom:Spacing['3xl'],gap:Spacing.md},
  empty:{alignItems:'center',paddingVertical:80},emptyTitle:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.xl,color:Colors.text,marginBottom:8},
  emptySub:{fontFamily:Typography.family.regular,fontSize:Typography.size.base,color:Colors.text2,textAlign:'center'},
  card:{backgroundColor:Colors.card,borderRadius:Radius.xl,borderWidth:1,borderColor:Colors.border,padding:Spacing.base,gap:Spacing.md},
  cardHeader:{flexDirection:'row',alignItems:'center',gap:Spacing.md},
  avatar:{width:40,height:40,borderRadius:20,backgroundColor:Colors.indigoDim2,alignItems:'center',justifyContent:'center'},
  avatarText:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.md,color:Colors.indigoLight},
  taskName:{fontFamily:Typography.family.bold,fontSize:Typography.size.md,color:Colors.text},
  meta:{fontFamily:Typography.family.regular,fontSize:Typography.size.xs,color:Colors.text3,marginTop:2},
  rewardBadge:{backgroundColor:Colors.greenDim,paddingHorizontal:Spacing.sm,paddingVertical:4,borderRadius:999},
  rewardText:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.sm,color:'#4ADE80'},
  proofBtn:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:Colors.card2,borderRadius:Radius.md,padding:Spacing.sm,borderWidth:1,borderColor:Colors.border2},
  proofBtnText:{fontFamily:Typography.family.semiBold,fontSize:Typography.size.sm,color:Colors.text2},
  question:{fontFamily:Typography.family.bold,fontSize:Typography.size.sm,color:Colors.text2},
  actionRow:{flexDirection:'row',gap:Spacing.sm},
  denyBtn:{flex:1,height:46,borderRadius:Radius.lg,alignItems:'center',justifyContent:'center',backgroundColor:Colors.redDim,borderWidth:1,borderColor:'rgba(239,68,68,0.3)'},
  denyText:{fontFamily:Typography.family.bold,fontSize:Typography.size.base,color:'#FCA5A5'},
  approveBtn:{flex:2,height:46,borderRadius:Radius.lg,alignItems:'center',justifyContent:'center',backgroundColor:Colors.green},
  approveText:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.base,color:'#fff'},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},
  sheet:{backgroundColor:Colors.bg2,borderTopLeftRadius:Radius['2xl'],borderTopRightRadius:Radius['2xl'],borderTopWidth:1,borderColor:Colors.border2,padding:Spacing.xl,gap:Spacing.base,paddingBottom:48},
  handle:{width:36,height:4,backgroundColor:Colors.border2,borderRadius:2,alignSelf:'center',marginBottom:8},
  sheetTitle:{fontFamily:Typography.family.extraBold,fontSize:Typography.size.xl,color:Colors.text},
  sheetSub:{fontFamily:Typography.family.regular,fontSize:Typography.size.base,color:Colors.text2,lineHeight:22},
  input:{backgroundColor:Colors.card2,borderRadius:Radius.md,borderWidth:1.5,borderColor:Colors.border2,padding:Spacing.md,fontFamily:Typography.family.regular,fontSize:Typography.size.base,color:Colors.text,height:90},
  cancelBtn:{flex:1,height:48,borderRadius:Radius.lg,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:Colors.border2},
  cancelText:{fontFamily:Typography.family.bold,color:Colors.text2},
  denyBtn2:{flex:1,height:48,borderRadius:Radius.lg,alignItems:'center',justifyContent:'center',backgroundColor:Colors.red},
  denyText2:{fontFamily:Typography.family.bold,color:'#fff'},
  proofOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.9)',alignItems:'center',justifyContent:'center',padding:Spacing.xl},
  proofImage:{width:'100%',height:400,borderRadius:Radius.lg},
})
