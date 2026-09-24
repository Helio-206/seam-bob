export type CustomerRow = Record<string, string>;

export class InMemoryDatabase {
  private readonly columns = new Set<string>();
  private readonly rows = new Map<string, CustomerRow>();
  private sequence = 0;

  constructor(initialColumns: string[]) {
    for (const column of initialColumns) {
      this.columns.add(column);
    }
  }

  hasColumn(name: string): boolean {
    return this.columns.has(name);
  }

  listColumns(): string[] {
    return [...this.columns].sort();
  }

  addColumn(name: string): void {
    if (this.columns.has(name)) return;

    this.columns.add(name);
    for (const row of this.rows.values()) {
      row[name] = "";
    }
  }

  renameColumn(from: string, to: string): void {
    this.assertColumn(from);
    this.columns.delete(from);
    this.columns.add(to);

    for (const row of this.rows.values()) {
      row[to] = row[from] ?? "";
      delete row[from];
    }
  }

  dropColumn(name: string): void {
    this.assertColumn(name);
    this.columns.delete(name);

    for (const row of this.rows.values()) {
      delete row[name];
    }
  }

  copyColumn(from: string, to: string): void {
    this.assertColumn(from);
    this.assertColumn(to);

    for (const row of this.rows.values()) {
      if ((row[to] ?? "") === "") {
        row[to] = row[from] ?? "";
      }
    }
  }

  insert(values: CustomerRow): CustomerRow {
    this.assertKnownColumns(values);

    const id = `cus_${++this.sequence}`;
    const row: CustomerRow = { id };

    for (const column of this.columns) {
      row[column] = values[column] ?? "";
    }

    this.rows.set(id, row);
    return { ...row };
  }

  update(id: string, values: CustomerRow): CustomerRow {
    this.assertKnownColumns(values);
    const row = this.rows.get(id);

    if (!row) {
      throw new Error(`Customer ${id} not found`);
    }

    Object.assign(row, values);
    return { ...row };
  }

  get(id: string): CustomerRow {
    const row = this.rows.get(id);
    if (!row) {
      throw new Error(`Customer ${id} not found`);
    }
    return { ...row };
  }

  readColumn(id: string, column: string): string {
    this.assertColumn(column);
    return this.get(id)[column] ?? "";
  }

  private assertKnownColumns(values: CustomerRow): void {
    for (const key of Object.keys(values)) {
      if (key === "id") continue;
      this.assertColumn(key);
    }
  }

  private assertColumn(name: string): void {
    if (!this.columns.has(name)) {
      throw new Error(`column "${name}" does not exist`);
    }
  }
}

export function createInitialDatabase(): InMemoryDatabase {
  return new InMemoryDatabase(["customer_name"]);
}
