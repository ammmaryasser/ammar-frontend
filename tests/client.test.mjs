import {test, beforeEach, after} from "node:test";
import assert from "node:assert/strict";
import {api, ApiError, loadBrands, loadCategories, resetReferenceCache, safeReturnPath, apiPartToVM} from "../lib/api.js";
import {movementToVM} from "../lib/movementModel.js";
const original = {fetch: globalThis.fetch, document: globalThis.document, window: globalThis.window};
const json = (body, status = 200) => new Response(JSON.stringify(body), {status});
beforeEach(() => {resetReferenceCache();globalThis.document = {cookie: ""};globalThis.window = new EventTarget();});
after(() => {Object.assign(globalThis, original);});
test("stock and movement contracts preserve dates, ordering and signed quantities", () => {
  const part = apiPartToVM({id:"P1",version:9,nameEn:"Pads",quantity:4,stockLog:[
    {d:"2026-01-01",t:"OUT",q:3},{d:"2025-12-31",t:"ADJ",q:-2},{d:"2025-12-30",t:"NEW_TYPE",q:4}
  ]}, "BMW", "Brakes");
  assert.equal(part.version,9);assert.deepEqual(part.history.map(h=>h.qty),[-3,-2,4]);
  assert.deepEqual(part.history.map(h=>h.date),["2026-01-01","2025-12-31","2025-12-30"]);
  assert.equal(part.history[2].type,"new_type");
  assert.deepEqual(movementToVM({id:1,date:"2024-01-02",t:"OUT",q:-5,partId:"deleted"}),
    {id:1,date:"2024-01-02",type:"out",qty:-5,ref:"",name:"deleted",nameAr:"",part:"—"});
});
test("return paths reject external and ambiguous destinations", () => {
  for(const p of [null,"https://evil.invalid","//evil.invalid","/\\evil.invalid","/login?next=/","/ foo"])
    assert.equal(safeReturnPath(p),"/");
  assert.equal(safeReturnPath("/parts?id=2#stock"),"/parts?id=2#stock");
});
test("failed CSRF initialization recovers, and concurrent writes share the request", async () => {
  let tokens=0,writes=0;
  globalThis.fetch=async path=>{if(path.endsWith("csrf")){tokens++;if(tokens===1)throw new TypeError("offline");return json({token:"good"});}
    writes++;return json({saved:true});};
  await assert.rejects(api("/api/parts",{method:"POST",body:{}}),e=>e.error==="NETWORK");
  await Promise.all([api("/api/parts",{method:"POST",body:{}}),api("/api/parts",{method:"POST",body:{}})]);
  assert.equal(tokens,2);assert.equal(writes,2);
});
test("only CSRF_INVALID is replayed once; failed writes are never automatically replayed", async () => {
  globalThis.document.cookie="XSRF-TOKEN=old";let writes=0,tokenCalls=0;
  globalThis.fetch=async (path,opts)=>{if(path.endsWith("csrf")){tokenCalls++;return json({token:"new"});}
    writes++;if(writes===1)return json({error:"CSRF_INVALID"},403);
    assert.equal(opts.headers["X-XSRF-TOKEN"],"new");return json({saved:true});};
  assert.deepEqual(await api("/api/parts",{method:"PUT",body:{version:1}}),{saved:true});
  assert.equal(writes,2);assert.equal(tokenCalls,1);
  writes=0;globalThis.fetch=async()=>{writes++;throw new TypeError("lost response");};
  await assert.rejects(api("/api/parts",{method:"PUT",body:{}}),e=>e.error==="NETWORK");assert.equal(writes,1);
  writes=0;globalThis.fetch=async path=>path.endsWith("csrf")?json({token:"new"}):(writes++,json({error:"CSRF_INVALID"},403));
  await assert.rejects(api("/api/parts",{method:"POST",body:{}}),e=>e.status===403);assert.equal(writes,2);
});
test("reference failures and authentication changes clear cached promises", async () => {
  let calls=0;globalThis.fetch=async()=>{calls++;return calls===1?json({error:"INTERNAL"},500):json([{id:"bmw"}]);};
  await assert.rejects(loadBrands());assert.deepEqual(await loadBrands(),[{id:"bmw"}]);await loadBrands();assert.equal(calls,2);
  resetReferenceCache();await loadBrands();assert.equal(calls,3);
  await loadCategories();assert.equal(calls,4);
  let expired=0;window.addEventListener("ay-session-expired",()=>expired++);
  globalThis.fetch=async()=>json({error:"UNAUTHORIZED",message:"expired"},401);
  await assert.rejects(api("/api/parts"),e=>e instanceof ApiError && e.status===401);assert.equal(expired,1);
  globalThis.fetch=async()=>{calls++;return json([]);};await loadBrands();assert.equal(calls,5);
});
test("validation fields and version conflicts reach callers without a retry", async () => {
  let calls=0;globalThis.document.cookie="XSRF-TOKEN=t";
  globalThis.fetch=async()=>{calls++;return json({error:"CONFLICT",message:"Reload the part",field:null},409);};
  await assert.rejects(api("/api/parts/P1",{method:"PUT",body:{version:0}}),e=>e.status===409);assert.equal(calls,1);
  globalThis.fetch=async()=>json({error:"VALIDATION",message:"Required",field:"nameEn"},400);
  await assert.rejects(api("/api/parts",{method:"POST",body:{}}),e=>e.field==="nameEn");
});

test("invoice descriptions and brand come from the snapshot without catalog data", async () => {
  const {mapSale}=await import("../lib/saleModel.js");
  const sale=mapSale({id:"I1",items:[{partId:"deleted",qty:2,unitPrice:"100",unitCost:"60",
    nameEn:"Original pads",nameAr:"فحمات",oem:"OEM-OLD",brandId:"bmw",brand:"BMW"}]},[]);
  assert.equal(sale.total,200);assert.equal(sale.profit,80);assert.equal(sale.items[0].name,"Original pads");
  assert.equal(sale.items[0].brand,"BMW");assert.equal(sale.items[0].oem,"OEM-OLD");
  const unknown=mapSale({items:[{partId:"lost",qty:1,unitPrice:50,unitCost:20,nameEn:"",nameAr:"",oem:"",brand:"Unknown"}]},[]);
  assert.equal(unknown.items[0].name,"lost");assert.equal(unknown.items[0].oem,"—");assert.equal(unknown.items[0].brand,"Unknown");
});
test("an obsolete reference rejection cannot discard a newer cached request", async () => {
  let rejectOld;let calls=0;
  globalThis.fetch=()=>{calls++;return calls===1?new Promise((_,reject)=>{rejectOld=reject;}):Promise.resolve(json([{id:"fresh"}]));};
  const old=loadBrands();resetReferenceCache();const fresh=loadBrands();
  rejectOld(new TypeError("old request failed"));await assert.rejects(old);
  await fresh;await loadBrands();assert.equal(calls,2);
});

test("expired logout clears authentication; invalid login stays on the login form",async()=>{
  let expired=0;window.addEventListener("ay-session-expired",()=>expired++);document.cookie="XSRF-TOKEN=t";
  globalThis.fetch=async()=>json({error:"UNAUTHORIZED",message:"Expired"},401);
  await assert.rejects(api("/api/auth/logout",{method:"POST"}));assert.equal(expired,1);
  document.cookie="XSRF-TOKEN=t";
  await assert.rejects(api("/api/auth/login",{method:"POST",body:{username:"owner",password:"wrong"}}));assert.equal(expired,1);
});
