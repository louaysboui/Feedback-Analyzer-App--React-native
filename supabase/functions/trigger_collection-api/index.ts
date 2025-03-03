// If you created a stub declaration file (global.d.ts) as shown above,
// you can keep the import so that type definitions are available:
//import "jsr:@supabase/functions-js/edge-runtime.d.ts"


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';


console.log("Hello from Functions!");
//"https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_lk538t2k2p1k3oos71&endpoint=https://ufmpmkjsccpdurstchyz.supabase.co/functions/v1/collection_webhook&format=json&uncompressed_webhook=true&include_errors=true"

//https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_lk538t2k2p1k3oos71&endpoint=${Deno.env.get("SUPABASE_URL")}/v1/collection_webhook&format=json&uncompressed_webhook=true&include_errors=true
//curl.exe -H "Authorization: Bearer a8be7adc62b63b6235b89e23ddd7c94fb82897ce832de945453b6d8b6026d3e0" -H "Content-Type: application/json" -d "{\"deliver\":{\"type\":\"s3\",\"filename\":{\"template\":\"{[snapshot_id]}\",\"extension\":\"json\"},\"bucket\":\"\",\"directory\":\"\"},\"input\":[{\"url\":\"https://www.youtube.com/@MrBeast/about\"}]}" "https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_lk538t2k2p1k3oos71&include_errors=true"
Deno.serve(async (req: Request) => {
  const { url } = await req.json();
  
  console.log("Url:", url); 

  const response = await fetch(`https://api.brightdata.com/datasets/v3/trigger?dataset_id=gd_lk538t2k2p1k3oos71&endpoint=${Deno.env.get("SUPABASE_URL")}/functions/v1/collection_webhook&format=json&uncompressed_webhook=true&include_errors=true`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get("BRIGHT_DATA_API_KEY")}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ url }]),
  });
  
  
if(!response.ok){ 
  return new Response(JSON.stringify({error:"Failed to trigger collection"}), {
    headers: { "Content-Type": "application/json" },
  });
}

const data = await response.json();  

// store job data in database
const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  ) 
const result = await supabase.from('scrape_jobs').insert({
  id:data.snapshot_id,
  status:"running",
})
console.log("result :" ,result);  

  return new Response(JSON.stringify({data}), {
    headers: { "Content-Type": "application/json" },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/trigger_collection-api' \
    --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/