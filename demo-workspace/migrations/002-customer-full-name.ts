import { InMemoryDatabase } from "../src/database.ts";

export function applyCustomerFullNameMigration(
  db: InMemoryDatabase,
): void {
  db.addColumn("full_name");
  db.copyColumn("customer_name", "full_name");
}
