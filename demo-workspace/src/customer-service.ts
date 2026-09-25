import { InMemoryDatabase } from "./database.ts";

export type CreateCustomerInput = {
  fullName?: string;
  /** @deprecated use fullName */
  customerName?: string;
};

export type CustomerView = {
  id: string;
  fullName: string;
  /** @deprecated use fullName */
  customerName: string;
};

export class CustomerService {
  constructor(private readonly db: InMemoryDatabase) {}

  createCustomer(input: CreateCustomerInput): CustomerView {
    const name = input.fullName ?? input.customerName ?? "";
    const payload: Record<string, string> = { customer_name: name };
    if (this.db.hasColumn("full_name")) {
      payload["full_name"] = name;
    }
    const row = this.db.insert(payload);

    return {
      id: row.id,
      fullName: row.full_name ?? row.customer_name,
      customerName: row.customer_name,
    };
  }

  getCustomer(id: string): CustomerView {
    const fullName =
      (this.db.hasColumn("full_name") && this.db.readColumn(id, "full_name")) ||
      this.db.readColumn(id, "customer_name");

    return {
      id,
      fullName,
      customerName: this.db.readColumn(id, "customer_name"),
    };
  }
}
