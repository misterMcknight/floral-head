const SHEET_ID='1I_IdCndVZnyAVHGsaUIK1mO3g8FAG0rmEmmJk1dUT4s';
const ROW={Kaftan:2,Suit:3,Agbada:4,Other:5};
export const config={maxDuration:120};
export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'});}
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'Image generation is not configured.'});
  try{
    const {category,images}=req.body||{};
    if(!Object.hasOwn(ROW,category)||!Array.isArray(images)||images.length<1||images.length>3)return res.status(400).json({error:'Select a garment type and 1–3 images.'});
    const row=ROW[category];
    const url='https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/gviz/tq?tqx=out:csv&gid=0&range=A'+row+':C'+row;
    const sheet=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'FLORAL-HEAD/1.0'}});
    if(!sheet.ok)throw new Error('The prompt spreadsheet is not publicly readable. Publish the sheet to the web.');
    const csv=await sheet.text();
    // CSV fields may contain line breaks and escaped double quotes.
    const fields=[];let field='',quoted=false;
    for(let i=0;i<csv.length;i++){const ch=csv[i];if(ch==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){fields.push(field);field='';}else if((ch==='\n'||ch==='\r')&&!quoted){break;}else field+=ch;}
    fields.push(field);
    const prompt=(Math.random()<0.7?fields[1]:fields[2])?.trim();
    if(!prompt||prompt.length<100)throw new Error('The selected garment prompt could not be read from the Google Sheet.');
    const form=new FormData();form.set('model','gpt-image-2.5-sunburst');form.set('prompt',prompt);form.set('size','1024x1536');form.set('quality','high');form.set('output_format','jpeg');
    for(let i=0;i<images.length;i++){const img=images[i];if(!img||!['image/jpeg','image/png','image/webp'].includes(img.type)||typeof img.data!=='string')return res.status(400).json({error:'Invalid image format.'});const raw=Buffer.from(img.data,'base64');if(!raw.length||raw.length>10*1024*1024)return res.status(413).json({error:'Each image must be smaller than 10 MB.'});form.append('image[]',new Blob([raw],{type:img.type}),'reference-'+(i+1)+'.'+(img.type==='image/png'?'png':img.type==='image/webp'?'webp':'jpg'));}
    const response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:form,signal:AbortSignal.timeout(110000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){console.error('OpenAI image error',response.status,data.error?.code||'unknown');return res.status(502).json({error:data.error?.message||'Image generation failed. Please try again.'});}
    const b64=data.data?.[0]?.b64_json;if(!b64)throw new Error('No image returned by the generation service.');
    res.setHeader('Cache-Control','no-store');return res.status(200).json({image:'data:image/jpeg;base64,'+b64});
  }catch(err){console.error('Generation error:',err.message);return res.status(500).json({error:err.message||'Unable to generate image.'});}
}