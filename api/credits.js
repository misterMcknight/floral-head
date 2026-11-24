const purchased=10;
const baselineSpend=6.42;
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');
if(req.method!=='GET')return res.status(405).end();
const auth=req.headers.authorization;
if(!auth||!auth.startsWith('Bearer '))return res.status(401).end();
try {
const u=await fetch('https://bdjbpvfurperdxyviiyl.supabase.co/auth/v1/user',{headers:{apikey:"sb_publishable_HGImemp0SdlMeliHw6KXJw_kIVou2Vh",Authorization:auth}});
if(!u.ok||(await u.json()).email?.toLowerCase()!=='mcknightcouture@gmail.com')return res.status(403).end();
if(!process.env.OPENAI_ADMIN_API_KEY)return res.json({purchased,spend:baselineSpend,balance:purchased-baselineSpend,live:false});
let spend=0,page;
do {
const q=new URLSearchParams({start_time:String(Date.UTC(2026,10,1)/1000),bucket_width:'1d',limit:'180'});if(page)q.set('page',page);
const r=await fetch('https://api.openai.com/v1/organization/costs?'+q,{headers:{Authorization:'Bearer '+process.env.OPENAI_ADMIN_API_KEY},signal:AbortSignal.timeout(15000)});
if(!r.ok)throw Error('Costs unavailable');
const d=await r.json();for(const b of d.data||[])for(const x of b.results||[]){if(x.amount?.currency?.toLowerCase()!=='usd'||!Number.isFinite(x.amount.value))throw Error('Unexpected billing data');spend+=x.amount.value;}
page=d.has_more?d.next_page:null;if(d.has_more&&!page)throw Error('Missing page');
}while(page);
spend=Math.max(spend,baselineSpend);
return res.json({purchased,spend,balance:purchased-spend,live:true});
}catch{return res.status(502).json({error:'Unable to refresh credit estimate'});}
}