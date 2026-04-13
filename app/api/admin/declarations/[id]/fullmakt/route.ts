import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  try{
    const{power_of_attorney_status}=await req.json();
    const ok=['pending','klar','fortsatter','behover_hjalp'];
    if(!power_of_attorney_status||!ok.includes(power_of_attorney_status))
      return NextResponse.json({error:'Ogiltig status'},{status:400});
    const{error}=await supabase.from('declarations').update({power_of_attorney_status,updated_at:new Date().toISOString()}).eq('id',params.id);
    if(error)return NextResponse.json({error:'DB-fel'},{status:500});
    return NextResponse.json({success:true});
  }catch{return NextResponse.json({error:'Fel'},{status:400});}
}
