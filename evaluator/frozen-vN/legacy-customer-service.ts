import { InMemoryDatabase } from "../../repo/src/database.ts";

/**
 * Frozen production version N.
 *
 * This file is intentionally OUTSIDE Bob's workspace and must never be edited
 * during the N+1 implementation experiment.
 */
export class FrozenLegacyCustomerService {
  constructor(private readonly db: InMemoryDatabase) {}

  createCustomer(customerName: string): { id: string; customerName: string } {
    const row = this.db.insert({
      customer_name: customerName,
    });

    return {
      id: row.id,
      customerName: row.customer_name,
    };
  }

  getCustomer(id: string): { id: string; customerName: string } {
    return {
      id,
      customerName: this.db.readColumn(id, "customer_name"),
    };
  }
}
