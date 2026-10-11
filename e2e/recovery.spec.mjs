import {test,expect} from "@playwright/test";
const part={id:"P-browser",version:1,oem:"OEM-TEST",nameEn:"Recovery pads",nameAr:"فحمات",brandId:"bmw",categoryId:"brakes",
  quantity:10,reorderAt:3,location:"A1",cost:"60",price:"100",fitment:[],priceHistory:[],
  stockLog:[{d:"2022-01-01",t:"OUT",q:2,ref:"old invoice"},{d:"2021-12-01",t:"UNRECOGNIZED",q:3,ref:"future type"}]};
const overview=name=>({range:"all",from:"2026-10-01",to:"2026-10-09",revenue:200,profit:80,units:2,invoices:1,avgMargin:40,
  monthly:[{month:"2026-10",revenue:200,profit:80}],bestSellers:[{partId:"P-browser",name,nameAr:"",oem:"OEM",brand:"BMW",qty:2,revenue:200,profit:80,margin:40}],
  brands:[{brand:"BMW",units:2,revenue:200,profit:80,share:100}]});
async function fixtures(page){
  await page.route("**/api/**",async route=>{
    const path=new URL(route.request().url()).pathname;
    let data=path==="/api/auth/me"?{username:"fixture-owner"}:path==="/api/auth/csrf"?{token:"csrf-test"}:
      path==="/api/brands"?[{id:"bmw",name:"BMW",models:[]}]:path==="/api/categories"?[{id:"brakes",nameEn:"Brakes",nameAr:"فرامل"}]:
      path==="/api/parts"?[part]:path.startsWith("/api/parts/")?part:path==="/api/movements"?[
        {id:2,date:"2022-01-02",partId:part.id,t:"OUT",q:-2,ref:"old invoice"},
        {id:1,date:"2021-01-01",partId:part.id,t:"UNRECOGNIZED",q:3,ref:"future type"}]:
      path==="/api/reports/overview"?overview("Snapshot pads"):[];
    await route.fulfill({json:data});
  });
}
test("@client reference fetch recovers and historical movement icons, signs and dates render",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));await fixtures(page);
  let calls=0;await page.route("**/api/brands",route=>{calls++;return route.fulfill(calls===1?{status:503,json:{error:"INTERNAL",message:"Temporary outage"}}:{json:[{id:"bmw",name:"BMW",models:[]}]});});
  await page.goto("/parts");await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button",{name:"Retry",exact:true}).click();
  await expect(page.getByText(part.nameEn,{exact:true})).toBeVisible();
  await page.goto("/movements");await expect(page.getByText("2022-01-02",{exact:true})).toBeVisible();
  await expect(page.getByText("-2",{exact:true})).toBeVisible();
  await page.goto(`/parts/${part.id}`);await expect(page.getByText("-2",{exact:true})).toBeVisible();
  await expect(page.getByText("2022-01-01",{exact:true})).toBeVisible();expect(errors).toEqual([]);
});
test("@client conflicts preserve drafts and validation failures restore the save button",async({page})=>{
  await fixtures(page);let current={...part};let writes=0;
  await page.route(`**/api/parts/${part.id}`,async route=>{
    if(route.request().method()==="PUT"){
      writes++;const input=route.request().postDataJSON();
      if(writes===1){current={...current,version:2};return route.fulfill({status:409,json:{status:409,error:"CONFLICT",message:"Part changed",field:null}});}
      if(writes===2)return route.fulfill({status:400,json:{status:400,error:"VALIDATION",message:"OEM already exists",field:"oem"}});
      expect(input.version).toBe(2);current={...current,...input,version:3};
    }
    await route.fulfill({json:current});
  });
  await page.goto(`/parts/${part.id}`);await page.getByRole("button",{name:"Edit Part"}).click();
  const dialog=page.getByRole("dialog");await dialog.getByTestId("part-nameEn").fill("My draft");
  await dialog.getByRole("button",{name:"Save",exact:true}).click();
  await expect(dialog.getByTestId("part-nameEn")).toHaveValue("My draft");
  await expect(dialog.getByRole("button",{name:"Reload and replace draft"})).toBeVisible();
  await expect(dialog.getByRole("button",{name:"Save",exact:true})).toBeEnabled();
  await dialog.getByRole("button",{name:"Reload and replace draft"}).click();
  await expect(dialog.getByTestId("part-nameEn")).toHaveValue(part.nameEn);
  await dialog.getByTestId("part-nameEn").fill("Saved draft");await dialog.getByRole("button",{name:"Save",exact:true}).click();
  await expect(dialog.getByTestId("part-oem")).toHaveAttribute("aria-invalid","true");
  await expect(dialog.getByRole("button",{name:"Save",exact:true})).toBeEnabled();
  await dialog.getByTestId("part-oem").fill("OEM-UNIQUE");await dialog.getByRole("button",{name:"Save",exact:true}).click();
  await expect(dialog).toHaveCount(0);await expect(page.getByRole("heading",{name:"Saved draft",exact:true})).toBeVisible();
});
test("@client an obsolete report response cannot overwrite the selected range",async({page})=>{
  await fixtures(page);let month;
  await page.route("**/api/reports/overview?*",async route=>{
    if(new URL(route.request().url()).searchParams.get("range")==="month"){month=route;return;}
    await route.fulfill({json:overview("Latest all range snapshot")});
  });
  await page.goto("/reports");await expect.poll(()=>Boolean(month)).toBe(true);
  await page.getByRole("button",{name:"All Time",exact:true}).click();
  await expect(page.getByText("Latest all range snapshot",{exact:true})).toBeVisible();
  const oldResponse=page.waitForResponse(r=>r.url().includes("range=month"));
  await month.fulfill({json:overview("Obsolete month snapshot")});await oldResponse;
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve())));
  await expect(page.getByText("Latest all range snapshot",{exact:true})).toBeVisible();
  await expect(page.getByText("Obsolete month snapshot",{exact:true})).toHaveCount(0);
});

test("@client a failed deletion remains visible in its dialog and can be retried",async({page})=>{
  await fixtures(page);let writes=0;
  await page.route(`**/api/parts/${part.id}`,route=>{
    if(route.request().method()==="DELETE"){
      writes++;return route.fulfill(writes===1?{status:500,json:{error:"INTERNAL",message:"Delete failed",field:null}}:{status:204,body:""});
    }
    return route.fulfill({json:part});
  });
  await page.goto(`/parts/${part.id}`);await page.getByRole("button",{name:"Delete",exact:true}).click();
  const dialog=page.getByRole("dialog");await dialog.getByRole("button",{name:"Delete",exact:true}).click();
  await expect(dialog.getByRole("alert")).toContainText("Delete failed");
  await expect(dialog.getByRole("button",{name:"Delete",exact:true})).toBeEnabled();
  await dialog.getByRole("button",{name:"Delete",exact:true}).click();await expect(page).toHaveURL(/\/parts$/);
  expect(writes).toBe(2);
});

test("@client the topbar can open a new sale again after closing it",async({page})=>{
  await fixtures(page);await page.goto("/sales");
  await page.getByRole("button",{name:"New Sale",exact:true}).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button",{name:"Close",exact:true}).click();
  await expect(page).toHaveURL(/\/sales$/);
  await page.getByRole("button",{name:"New Sale",exact:true}).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
