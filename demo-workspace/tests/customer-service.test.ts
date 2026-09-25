import assert from "node:assert/strict";
import test from "node:test";

import { applyCustomerFullNameMigration } from "../migrations/002-customer-full-name.ts";
import { CustomerService } from "../src/customer-service.ts";
import { createInitialDatabase } from "../src/database.ts";

test("creates and reads a customer", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const service = new CustomerService(db);
  const created = service.createCustomer({
    customerName: "Ada Lovelace",
  });

  assert.equal(created.customerName, "Ada Lovelace");
  assert.equal(service.getCustomer(created.id).customerName, "Ada Lovelace");
});

test("migration can run once without corrupting the current service", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const service = new CustomerService(db);
  const created = service.createCustomer({
    customerName: "Grace Hopper",
  });

  assert.equal(service.getCustomer(created.id).customerName, "Grace Hopper");
});

test("fullName input produces correct fullName and customerName output", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const service = new CustomerService(db);
  const created = service.createCustomer({ fullName: "Alan Turing" });

  assert.equal(created.fullName, "Alan Turing");
  assert.equal(created.customerName, "Alan Turing");
});

test("getCustomer returns both fullName and customerName populated", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const service = new CustomerService(db);
  const created = service.createCustomer({ fullName: "Dorothy Vaughan" });
  const fetched = service.getCustomer(created.id);

  assert.equal(fetched.fullName, "Dorothy Vaughan");
  assert.equal(fetched.customerName, "Dorothy Vaughan");
});

test("migration is idempotent (run twice, service still works)", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);
  applyCustomerFullNameMigration(db);

  const service = new CustomerService(db);
  const created = service.createCustomer({ fullName: "Mary Kenneth Keller" });

  assert.equal(created.fullName, "Mary Kenneth Keller");
  assert.equal(created.customerName, "Mary Kenneth Keller");
  assert.equal(service.getCustomer(created.id).fullName, "Mary Kenneth Keller");
});

test("dual-write: both DB columns contain the correct value after createCustomer", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const service = new CustomerService(db);
  const created = service.createCustomer({ fullName: "Katherine Johnson" });

  assert.equal(db.readColumn(created.id, "full_name"), "Katherine Johnson");
  assert.equal(db.readColumn(created.id, "customer_name"), "Katherine Johnson");
});

test("LIVE_N_WRITE_COMPAT: row written by version N (customer_name only) still returns correct fullName", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  // Simulate a version-N write: insert using only customer_name, leaving full_name empty.
  const row = db.insert({ customer_name: "Lise Meitner", full_name: "" });

  const service = new CustomerService(db);
  const fetched = service.getCustomer(row.id);

  assert.equal(fetched.fullName, "Lise Meitner");
  assert.equal(fetched.customerName, "Lise Meitner");
});

test("version-N service (no migration): createCustomer works against un-migrated DB", () => {
  const db = createInitialDatabase();
  // No migration applied — full_name column does not exist yet.

  const service = new CustomerService(db);
  const created = service.createCustomer({ customerName: "Test User" });

  assert.equal(created.customerName, "Test User");
  assert.equal(created.fullName, "Test User");
});
