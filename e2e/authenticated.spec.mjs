import {test, expect} from "@playwright/test";
const password = process.env.E2E_OWNER_PASSWORD;
async function write(request, path, method, data) {
  const csrf=await (await request.get("/api/auth/csrf")).json();
  return request.fetch(path,{method,data,headers:{"X-XSRF-TOKEN":csrf.token}});
}
async function apiLogin(request) {
  const res=await write(request,"/api/auth/login","POST",{username:"owner",password});
  expect(res.status()).toBe(200);
}
test("protected print and dashboard routes return to login with a local path", async ({page}) => {
  await page.goto("/print/invoice/INV-999");
  await expect(page).toHaveURL(/\/login\?next=%2Fprint%2Finvoice%2FINV-999/);
  await expect(page.getByRole("heading",{name:"Sign in"})).toBeVisible();
});
test("real sessions, stale drafts, stock, invoices, reports and shared settings", async ({page,context,browser}) => {
  expect(password,"Set E2E_OWNER_PASSWORD for the isolated acceptance backend").toBeTruthy();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/parts");await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel("Password",{exact:true}).fill("wrong-password");
  await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button",{name:"Sign in",exact:true})).toBeEnabled();
  await page.getByLabel("Password",{exact:true}).fill(password);
  await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await expect(page).toHaveURL(/\/parts$/);
  const cookies=await context.cookies();const session=cookies.find(c=>c.name==="SESSION");
  expect(session.httpOnly).toBe(true);expect(session.path).toBe("/");expect(session.sameSite).toBe("Lax");
  const input={oem:`E2E-${Date.now()}`,nameEn:"Historical pads",nameAr:"فحمات تاريخية",brand:"bmw",category:"brakes",
    fitment:[],quantity:10,reorderAt:3,location:"A1",cost:60,price:100};
  let res=await write(context.request,"/api/parts","POST",input);expect(res.status()).toBe(201);
  let part=await res.json();
  res=await write(context.request,"/api/customers","POST",{name:"Browser buyer",phone:"",car:"",notes:""});expect(res.status()).toBe(201);
  const customer=await res.json();
  await page.goto(`/parts/${part.id}`);await page.getByRole("button",{name:"Edit Part"}).click();
  const dialog=page.getByRole("dialog");await dialog.getByTestId("part-nameEn").fill("Keep my draft");
  res=await write(context.request,"/api/movements/stock-in","POST",{partId:part.id,qty:2,ref:"Shipment"});expect(res.status()).toBe(200);
  const changed=await res.json();expect(changed.version).toBeGreaterThan(part.version);
  await dialog.getByRole("button",{name:"Save",exact:true}).click();
  await expect(dialog.getByRole("button",{name:"Reload and replace draft"})).toBeVisible();
  await expect(dialog.getByTestId("part-nameEn")).toHaveValue("Keep my draft");
  await expect(dialog.getByRole("button",{name:"Save",exact:true})).toBeEnabled();
  await dialog.getByRole("button",{name:"Reload and replace draft"}).click();
  await expect(dialog.getByTestId("part-nameEn")).toHaveValue(input.nameEn);
  await dialog.getByTestId("part-oem").fill(" ");
  await dialog.getByRole("button",{name:"Save",exact:true}).click();
  await expect(dialog).toBeVisible();await dialog.getByTestId("part-oem").fill(input.oem);
  await dialog.getByRole("button",{name:"Save",exact:true}).click();await expect(dialog).toHaveCount(0);
  await page.goto("/sales?new=1");
  await page.getByRole("dialog").getByTestId("sale-customer").selectOption(customer.id);
  await page.getByRole("dialog").getByTestId("sale-part-0").selectOption(part.id);
  await page.getByRole("dialog").getByTestId("sale-qty-0").fill("2");
  await page.getByRole("dialog").getByRole("button",{name:/Complete|Save|Record|Create|Confirm/}).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const sales=await (await context.request.get("/api/sales")).json();const sale=sales[0];
  expect(sale.items[0].nameEn).toBe(input.nameEn);expect(sale.items[0].brand).toBe("BMW");
  await page.goto("/movements");await expect(page.getByRole("cell").filter({hasText:input.oem}).first()).toBeVisible();
  await expect(page.getByText("-2",{exact:true}).first()).toBeVisible();
  await page.goto("/");await expect(page.getByRole("heading",{name:"Dashboard",exact:true})).toBeVisible();
  const summary=await (await context.request.get("/api/dashboard/summary")).json();expect(Number(summary.todaysSales)).toBeGreaterThanOrEqual(200);
  part=await (await context.request.get(`/api/parts/${part.id}`)).json();
  res=await write(context.request,`/api/parts/${part.id}`,"PUT",{...input,version:part.version,quantity:10,brand:"audi",nameEn:"Edited catalog"});expect(res.status()).toBe(200);
  res=await write(context.request,`/api/parts/${part.id}`,"DELETE");expect(res.status()).toBe(204);
  await page.goto(`/print/invoice/${sale.id}`);await expect(page.getByText(input.nameEn,{exact:true})).toBeVisible();
  await page.goto("/reports");await expect(page.getByRole("heading",{name:"Reports",exact:true})).toBeVisible();
  const report=await (await context.request.get("/api/reports/overview?range=all")).json();
  expect(report.brands.some(b=>b.brand==="BMW" && Number(b.revenue)>=200)).toBe(true);
  const imported="Explicit import "+Date.now();
  await page.evaluate(value=>localStorage.setItem("ay-shop-settings",JSON.stringify({taglineEn:value})),imported);
  await page.goto("/settings");await expect(page.getByTestId("setting-taglineEn")).not.toHaveValue(imported);
  await page.getByText("Preview browser-saved settings",{exact:true}).click();
  await page.getByRole("button",{name:"Import these settings to the server"}).click();
  await expect(page.getByTestId("setting-taglineEn")).toHaveValue(imported);
  expect(await page.evaluate(()=>localStorage.getItem("ay-shop-settings"))).toContain(imported);
  const other=await browser.newContext({baseURL:"http://localhost:13000"});
  await apiLogin(other.request);const otherPage=await other.newPage();await otherPage.goto("/settings");
  await expect(otherPage.getByTestId("setting-taglineEn")).toHaveValue(imported);await other.close();
  // Revoke on the server to exercise protected-request 401 handling and login return paths.
  expect((await write(context.request,"/api/auth/logout","POST")).status()).toBe(204);
  await page.goto("/parts");await expect(page).toHaveURL(/\/login\?next=/);
  expect(errors).toEqual([]);
});
