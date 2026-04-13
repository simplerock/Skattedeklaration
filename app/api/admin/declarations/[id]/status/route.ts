import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
export async function PATCH(req:NextRequest,{params}:{params:{id:string}}){
  try{const{status}=await req.json();const ok=['submitted','processing','completed','error'];if(!status||!ok.includes(status))return NextResponse.json({error:'Ogiltig status'},{status:400});const{error}=await supabase.from('declarations').update({status,updated_at:new Date().toISOString()}).eq('id',params.id);if(error)return NextResponse.json({error:'DB-fel'},{status:500});return NextResponse.json({success:true,status});}catch{return NextResponse.json({error:'Fel'},{status:400});}
}
