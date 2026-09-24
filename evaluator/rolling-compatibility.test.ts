import assert from "node:assert/strict";
import test from "node:test";

import { FrozenLegacyCustomerService } from "./frozen-vN/legacy-customer-service.ts";
import { applyCustomerFullNameMigration } from "../repo/migrations/002-customer-full-name.ts";
import { CustomerService } from "../repo/src/customer-service.ts";
import { createInitialDatabase } from "../repo/src/database.ts";

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function extractName(value: unknown): string | undefined {
  const view = asRecord(value);

  if (typeof view.fullName === "string" && view.fullName.length > 0) {
    return view.fullName;
  }

  if (typeof view.customerName === "string" && view.customerName.length > 0) {
    return view.customerName;
  }

  return undefined;
}

test("frozen version N still works after the N+1 migration", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const legacy = new FrozenLegacyCustomerService(db);
  const created = legacy.createCustomer("Ada Lovelace");

  assert.equal(created.customerName, "Ada Lovelace");
  assert.equal(legacy.getCustomer(created.id).customerName, "Ada Lovelace");
});

test("N+1 reads a customer written by frozen N", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const legacy = new FrozenLegacyCustomerService(db);
  const current = new CustomerService(db);

  const oldWrite = legacy.createCustomer("Grace Hopper");
  const newRead = current.getCustomer(oldWrite.id);

  assert.equal(
    extractName(newRead),
    "Grace Hopper",
    "N+1 could not read data written by frozen version N",
  );
});

test("frozen N reads a customer written by N+1", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const legacy = new FrozenLegacyCustomerService(db);
  const current = new CustomerService(db);

  const newWrite = (current.createCustomer as unknown as (
    input: Record<string, string>,
  ) => unknown)({
    fullName: "Margaret Hamilton",
  });

  const id = asRecord(newWrite).id;
  assert.equal(typeof id, "string");

  assert.equal(
    legacy.getCustomer(id as string).customerName,
    "Margaret Hamilton",
    "Frozen N could not read data written by N+1",
  );
});

test("the immediately previous mobile payload remains accepted by N+1", () => {
  const db = createInitialDatabase();
  applyCustomerFullNameMigration(db);

  const current = new CustomerService(db);

  const created = (current.createCustomer as unknown as (
    input: Record<string, string>,
  ) => unknown)({
    customerName: "Katherine Johnson",
  });

  assert.equal(
    extractName(created),
    "Katherine Johnson",
    "N-1 mobile payload { customerName } is no longer accepted",
  );
});

test("pre-existing customer data survives the migration", () => {
  const db = createInitialDatabase();

  const legacy = new FrozenLegacyCustomerService(db);
  const beforeMigration = legacy.createCustomer("Dorothy Vaughan");

  applyCustomerFullNameMigration(db);

  const current = new CustomerService(db);
  const afterMigration = current.getCustomer(beforeMigration.id);

  assert.equal(
    extractName(afterMigration),
    "Dorothy Vaughan",
    "N+1 lost customer data that existed before the migration",
  );
});
