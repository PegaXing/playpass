import{useEffect,useState,useCallback}from'react';import{View,Text,StyleSheet,ScrollView,RefreshControl,ActivityIndicator}from'react-native';import{SafeAreaView}from'react-native-safe-area-context';import{useAuth}from'../../lib/auth-context';import{supabase,db}from'../../lib/supabase';import{Colors,Typography,Spacing,Radius}from'../../constants/design';
const fmtTime=(m)=>{const h=Math.floor(Math.max(0,m)/60),min=Math.max(0,m)%60;return h+':'+String(min).padStart(2,'0')};
const fmtLabel=(m)=>{const h=Math.floor(Math.abs(m)/60),min=Math.abs(m)%60;return h>0?(min>0?h+'h '+min+'m':h+'h'):min+'m'};
const timeAgo=(d)=>{const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<60)return m+'m ago';const h=Math.floor(m/60);return h<24?h+'h ago':Math.floor(h/24)+'d ago'};
const TX_ICON={task_reward:'✅',xbox_deduction:'🎮',daily_allowance:'🌅',manual_add:'⭐',manual_remove:'➖',streak_bonus:'🔥'};
const TX_LABEL={task_reward:'Mission reward',xbox_deduction:'Xbox gaming',daily_allowance:'Daily Pass',manual_add:'Bonus time',manual_remove:'Time removed',streak_bonus:'Streak bonus'};
export default function ChildWallet(){
  const{user,childProfile}=useAuth();const[transactions,setTransactions]=useState([]);const[loading,setLoading]=useState(true);const[refreshing,setRefreshing]=useState(false);
  const load=useCallback(async()=>{if(!user?.id)return;const{data}=await db.getWalletTransactions(user.id,40);if(data)setTransactions(data)},[user?.id]);
  useEffect(()=>{load().finally(()=>setLoading(false))},[load]);
  useEffect(()=>{if(!user?.id)return;const ch=supabase.channel('child-wallet').on('postgres_changes',{event:'INSERT',schema:'public',table:'wallet_transactions',filter:'child_id=eq.'+user.id},load).subscribe();return()=>{supabase.removeChannel(ch)}},[user?.id,load]);
  const today=new Date().toDateString();
  const earnedToday=transactions.filter(t=>new Date(t.created_at).toDateString()===today&&t.amount_mins>0).reduce((s,t)=>s+t.amount_mins,0);
  const usedToday=Math.abs(transactions.filter(t=>new Date(t.created_at).toDateString()===today&&t.amount_mins<0).reduce((s,t)=>s+t.amount_mins,0));
  const balance=childProfile?.wallet_balance_mins??0;
  if(loading)return<View style={{flex:1,backgroundColor:Colors.bg,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={Colors.cyan} size="large"/></View>;
  return(<SafeAreaView style={{flex:1,backgroundColor:Colors.bg}} edges={['top']}>
    <View style={{paddingHorizontal:Spacing.xl,paddingTop:Spacing.xl,paddingBottom:Spacing.base}}><Text style={{fontFamily:Typography.family.extraBold,fontSize:Typography.size['2xl'],color:Colors.text}}>Pass Wallet</Text></View>
    <ScrollView contentContainerStyle={{paddingHorizontal:Spacing.xl,paddingBottom:Spacing['4xl'],gap:Spacing.md}} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load();setRefreshing(false)}} tintColor={Colors.cyan}/>}>
      <View style={{backgroundColor:Colors.card,borderRadius:Radius['2xl'],borderWidth:1,borderColor:Colors.border2,padding:Spacing.xl,overflow:'hidden',position:'relative'}}>
        <View style={{position:'absolute',width:160,height:160,borderRadius:80,backgroundColor:'rgba(91,103,248,0.2)',top:-40,right:-40}}/>
        <View style={{position:'absolute',width:120,height:120,borderRadius:60,backgroundColor:'rgba(0,212,255,0.1)',bottom:-20,left:20}}/>
        <View style={{position:'relative',zIndex:1}}>
          <Text style={{fontFamily:Typography.family.regular,fontSize:Typography.size.sm,color:Colors.text2,marginBottom:2}}>Pass Time Remaining</Text>
          <Text style={{fontFamily:Typography.family.bold,fontSize:Typography.size.md,color:Colors.text,marginBottom:Spacing.base}}>Your Pass Balance</Text>
          <Text style={{fontFamily:Typography.family.extraBold,fontSize:52,color:Colors.text,lineHeight:56}}>{fmtTime(balance)}</Text>
          <Text style={{fontFamily:Typography.family.bold,fontSize:10,color:Colors.text3,letterSpacing:2}}>HOURS : MINUTES</Text>
        </View>
      </View>
      <View style={{flexDirection:'row',gap:Spacing.sm}}>
        <View style={{flex:1,backgroundColor:Colors.greenDim,borderRadius:Radius.lg,padding:Spacing.base,alignItems:'center'}}>
          <Text style={{fontFamily:Typography.family.bold,fontSize:11,color:'#4ADE80',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Earned today</Text>
          <Text style={{fontFamily:Typography.family.extraBold,fontSize:Typography.size.xl,color:'#4ADE80'}}>+{fmtLabel(earnedToday)}</Text>
        </View>
        <View style={{flex:1,backgroundColor:Colors.redDim,borderRadius:Radius.lg,padding:Spacing.base,alignItems:'center'}}>
          <Text style={{fontFamily:Typography.family.bold,fontSize:11,color:'#F87171',textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Used today</Text>
          <Text style={{fontFamily:Typography.family.extraBold,fontSize:Typography.size.xl,color:'#F87171'}}>-{fmtLabel(usedToday)}</Text>
        </View>
      </View>
      <Text style={{fontFamily:Typography.family.extraBold,fontSize:Typography.size.md,color:Colors.text}}>All transactions</Text>
      <View style={{backgroundColor:Colors.card,borderRadius:Radius.xl,borderWidth:1,borderColor:Colors.border,overflow:'hidden'}}>
        {transactions.length===0?(<View style={{padding:Spacing.xl,alignItems:'center'}}><Text style={{color:Colors.text3,fontFamily:Typography.family.regular}}>No transactions yet</Text></View>):transactions.map((tx,i)=>(
          <View key={tx.id}>
            <View style={{flexDirection:'row',alignItems:'center',gap:Spacing.md,padding:Spacing.base}}>
              <View style={{width:34,height:34,borderRadius:10,backgroundColor:tx.amount_mins>0?Colors.greenDim:Colors.indigoDim,alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:15}}>{TX_ICON[tx.transaction_type]||'💫'}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontFamily:Typography.family.bold,fontSize:Typography.size.sm,color:Colors.text,marginBottom:2}}>{tx.note||TX_LABEL[tx.transaction_type]||tx.transaction_type}</Text>
                <Text style={{fontFamily:Typography.family.regular,fontSize:Typography.size.xs,color:Colors.text3}}>{timeAgo(tx.created_at)}</Text>
              </View>
              <Text style={{fontFamily:Typography.family.extraBold,fontSize:Typography.size.base,color:tx.amount_mins>0?'#4ADE80':'#F87171'}}>{tx.amount_mins>0?'+':''}{fmtLabel(tx.amount_mins)}</Text>
            </View>
            {i<transactions.length-1&&<View style={{height:1,backgroundColor:Colors.border,marginHorizontal:Spacing.base}}/>}
          </View>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>)
}