const URL='https://bdjbpvfurperdxyviiyl.supabase.co';
const KEY='sb_publishable_HGImemp0SdlMeliHw6KXJw_kIVou2Vh';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();
 const {event_type,visitor_id}=req.body||{};
 if(!['visit','generation'].includes(event_type)||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitor_id||'')))return res.status(400).json({error:'Invalid event'});
 const country=(req.headers['x-vercel-ip-country']||'Unknown').toString().slice(0,100);
 try{const r=await fetch(URL+'/rest/v1/floral_head_events',{method:'POST',headers:{'apikey':KEY,'Authorization':'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({event_type,visitor_id,country})});if(!r.ok)throw Error('Tracking unavailable');return res.status(204).end();}catch{return res.status(503).json({error:'Tracking unavailable'});}
}
