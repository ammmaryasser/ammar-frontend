// Customers service — live API (Phase 9). Same exports/shapes as the mock.
import { api } from "@/lib/api";

const num = (v) => (v === null || v === undefined ? 0 : Number(v));

export async function getCustomers() {
  const [customers, sales] = await Promise.all([api("/api/customers"), api("/api/sales")]);
  return customers.map((c) => {
    const purchases = sales.filter((s) => s.customerId === c.id);
    return {
      ...c,
      purchases: purchases.length,
      spent: purchases.reduce(
        (sum, s) => sum + (s.items ?? []).reduce((t, it) => t + it.qty * num(it.unitPrice), 0),
        0,
      ),
    };
  });
}

export async function createCustomer({ name, phone, car, notes }) {
  const created = await api("/api/customers", {
    method: "POST",
    body: { name, phone: phone || "", car: car || "", notes: notes || "" },
  });
  return { ...created, purchases: 0, spent: 0 };
}
