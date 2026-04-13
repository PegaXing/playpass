import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { router } from 'expo-router'
import { supabase, db } from './supabase'
import { registerForPushNotifications } from './notifications'
import type { Session } from '@supabase/supabase-js'
type Role = 'parent' | 'child'
export interface AppUser { id:string; family_id:string; role:Role; display_name:string; avatar_url:string|null; expo_push_token:string|null }
export interface AppFamily { id:string; name:string; invite_code:string; subscription_tier:string }
export interface ChildProfile { id:string; user_id:string; family_id:string; xbox_gamertag:string|null; xbox_xuid:string|null; daily_base_allowance_mins:number; wallet_balance_mins:number; streak_days:number; last_streak_date:string|null }
interface AuthCtxType { session:Session|null; user:AppUser|null; family:AppFamily|null; childProfile:ChildProfile|null; isLoading:boolean; isParent:boolean; isChild:boolean; signUp(p:{email:string;password:string;displayName:string;familyName:string}):Promise<{error:string|null}>; signIn(p:{email:string;password:string}):Promise<{error:string|null}>; joinAsChild(p:{inviteCode:string;displayName:string}):Promise<{error:string|null}>; signOut():Promise<void>; refreshProfile():Promise<void> }
const AuthCtx = createContext<AuthCtxType|null>(null)
export function AuthProvider({children}:{children:React.ReactNode}) {
  const [session,setSession]=useState<Session|null>(null)
  const [user,setUser]=useState<AppUser|null>(null)
  const [family,setFamily]=useState<AppFamily|null>(null)
  const [childProfile,setChildProfile]=useState<ChildProfile|null>(null)
  const [isLoading,setIsLoading]=useState(true)
  const loadProfile = useCallback(async (s:Session) => {
    try {
      const {data:u} = await db.getCurrentUser(s.user.id); if(!u) return
      const {data:f} = await db.getFamily(u.family_id)
      setUser(u as AppUser); setFamily(f as AppFamily??null)
      if(u.role==='child') { const {data:cp}=await db.getChildProfile(s.user.id); setChildProfile(cp as ChildProfile??null) }
      const token = await registerForPushNotifications(); if(token) await db.updatePushToken(s.user.id,token)
    } catch(e) { console.error('loadProfile:',e) }
  },[])
  const refreshProfile = useCallback(async () => { if(session) await loadProfile(session) },[session,loadProfile])
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session:s}}) => { setSession(s); if(s) loadProfile(s).finally(()=>setIsLoading(false)); else setIsLoading(false) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange(async (_,s) => { setSession(s); if(s){setIsLoading(true);await loadProfile(s);setIsLoading(false)} else {setUser(null);setFamily(null);setChildProfile(null)} })
    return () => subscription.unsubscribe()
  },[loadProfile])
  useEffect(() => {
    if(isLoading) return
    if(!session||!user){router.replace('/(auth)/welcome');return}
    if(user.role==='parent') router.replace('/(parent)/dashboard'); else router.replace('/(child)/home')
  },[session,user,isLoading])
  const signUp = async ({email,password,displayName,familyName}:{email:string;password:string;displayName:string;familyName:string}) => {
    try {
      const {data:fam,error:fe}=await supabase.from('families').insert({name:familyName}).select().single(); if(fe||!fam) return {error:'Failed to create family.'}
      const {error:ae}=await supabase.auth.signUp({email,password,options:{data:{family_id:(fam as any).id,role:'parent',display_name:displayName}}}); if(ae){await supabase.from('families').delete().eq('id',(fam as any).id);return {error:ae.message}}
      return {error:null}
    } catch { return {error:'Something went wrong.'} }
  }
  const signIn = async ({email,password}:{email:string;password:string}) => { const {error}=await supabase.auth.signInWithPassword({email,password}); return {error:error?.message??null} }
  const joinAsChild = async ({inviteCode,displayName}:{inviteCode:string;displayName:string}) => {
    try {
      const {data:fam,error:fe}=await db.getFamilyByInviteCode(inviteCode); if(fe||!fam) return {error:'Invalid invite code.'}
      const email='child_'+inviteCode.toLowerCase()+'_'+Date.now()+'@playpass.internal'
      const pass='pp_'+inviteCode+'_'+Date.now()+'_'+Math.random().toString(36).slice(2)
      const {data:auth,error:ae}=await supabase.auth.signUp({email,password:pass,options:{data:{family_id:(fam as any).id,role:'child',display_name:displayName}}}); if(ae||!auth.user) return {error:'Failed to create account.'}
      await supabase.from('child_profiles').insert({user_id:auth.user.id,family_id:(fam as any).id,wallet_balance_mins:30})
      return {error:null}
    } catch { return {error:'Something went wrong.'} }
  }
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setFamily(null); setChildProfile(null) }
  return <AuthCtx.Provider value={{session,user,family,childProfile,isLoading,isParent:user?.role==='parent',isChild:user?.role==='child',signUp,signIn,joinAsChild,signOut,refreshProfile}}>{children}</AuthCtx.Provider>
}
export const useAuth = () => { const ctx=useContext(AuthCtx); if(!ctx) throw new Error('useAuth must be inside AuthProvider'); return ctx }