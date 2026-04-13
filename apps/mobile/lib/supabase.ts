import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
const SecureStoreAdapter = { getItem: (k:string) => SecureStore.getItemAsync(k), setItem: (k:string,v:string) => SecureStore.setItemAsync(k,v), removeItem: (k:string) => SecureStore.deleteItemAsync(k) }
export const supabase = createClient('https://nitrvpyohmqwofcexkxv.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdHJ2cHlvaG1xd29mY2V4a3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODA1NTcsImV4cCI6MjA5MTY1NjU1N30.v5PF9O0lTbjiF5hmhkrowuF_H3Rl75rGmMU4-H2DlF8',{ auth:{ storage:SecureStoreAdapter, autoRefreshToken:true, persistSession:true, detectSessionInUrl:false } })
const XBL_KEY = '2c605d2d-f263-49f8-9718-b05d6e7b8d20'
export const db = {
  getCurrentUser: (uid:string) => supabase.from('users').select('*').eq('id',uid).single(),
  updatePushToken: (uid:string,token:string) => supabase.from('users').update({expo_push_token:token}).eq('id',uid),
  getFamily: (fid:string) => supabase.from('families').select('*').eq('id',fid).single(),
  getFamilyByInviteCode: (code:string) => supabase.from('families').select('*').eq('invite_code',code.toUpperCase()).single(),
  getChildProfile: (uid:string) => supabase.from('child_profiles').select('*').eq('user_id',uid).single(),
  getChildrenInFamily: (fid:string) => supabase.from('child_profiles').select('*, user:users(id,display_name,avatar_url,role)').eq('family_id',fid),
  getTasksForChild: (childId:string) => supabase.from('tasks').select('*').eq('assigned_to',childId).eq('is_active',true).order('created_at',{ascending:false}),
  getTasksForFamily: (fid:string) => supabase.from('tasks').select('*, assigned_user:users!assigned_to(id,display_name,avatar_url)').eq('family_id',fid).eq('is_active',true).order('created_at',{ascending:false}),
  createTask: (task:any) => supabase.from('tasks').insert(task).select().single(),
  archiveTask: (taskId:string) => supabase.from('tasks').update({is_active:false}).eq('id',taskId),
  submitTaskCompletion: (c:any) => supabase.from('task_completions').insert(c).select().single(),
  getPendingCompletions: (fid:string) => supabase.from('task_completions').select('*, task:tasks(id,title,reward_mins), child:users!child_id(id,display_name,avatar_url)').eq('family_id',fid).eq('status','pending').order('submitted_at',{ascending:false}),
  getChildCompletionHistory: (childId:string,limit=20) => supabase.from('task_completions').select('*, task:tasks(id,title,reward_mins)').eq('child_id',childId).order('submitted_at',{ascending:false}).limit(limit),
  approveCompletion: (id:string,reviewedBy:string) => supabase.from('task_completions').update({status:'approved',reviewed_at:new Date().toISOString(),reviewed_by:reviewedBy}).eq('id',id),
  rejectCompletion: (id:string,reviewedBy:string,reason?:string) => supabase.from('task_completions').update({status:'rejected',reviewed_at:new Date().toISOString(),reviewed_by:reviewedBy,rejection_reason:reason}).eq('id',id),
  getWalletTransactions: (childId:string,limit=30) => supabase.from('wallet_transactions').select('*').eq('child_id',childId).order('created_at',{ascending:false}).limit(limit),
  addManualTime: (p:{child_id:string;family_id:string;amount_mins:number;note?:string;created_by:string}) => supabase.from('wallet_transactions').insert({...p,transaction_type:p.amount_mins>0?'manual_add':'manual_remove'}),
  getUnreadCount: async (uid:string):Promise<number> => { const {count} = await supabase.from('notifications').select('*',{count:'exact',head:true}).eq('user_id',uid).eq('is_read',false); return count??0 },
  lookupXboxGamertag: async (gamertag:string):Promise<{xuid:string}|null> => {
    try { const r = await fetch('https://xbl.io/api/v2/friends/search?gt='+encodeURIComponent(gamertag),{headers:{'x-authorization':XBL_KEY,'Accept-Language':'en-GB'}}); if(!r.ok) return null; const d=await r.json(); const p=d?.profileUsers?.[0]; return p?{xuid:p.id}:null } catch { return null }
  },
}