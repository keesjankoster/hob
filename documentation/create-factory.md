# 🏭 Scaffolding Test Data Factories

[← Back to Documentation](README.md)

Scaffold modern, high-performance Apex Test Data Factory classes with separated `build` (in-memory) and `create` (DML) methods:

```bash
hob create factory <sobject> [options]
```

---

## 📖 Description

In modern Salesforce development, writing raw `insert new Account(...)` statements across test methods leads to slow test executions, fragile tests, and maintenance headaches when validation rules change.

**Hob Test Data Factory** scaffolds clean, robust test factories following the industry-standard builder pattern:
- **`build<SObject>()` (No DML)**: Creates valid records in-memory without database transactions. Unit tests execute in milliseconds and remain decoupled from database state.
- **`create<SObject>()` (With DML)**: Inserts records into the database when integration testing requires record IDs or triggers.
- **Bulk Methods**: Includes `build<SObject>List(count)` and `create<SObject>List(count)` for governor-limit stress testing.
- **Field Overrides**: Supports `Map<String, Object>` overrides to easily customize specific fields without breaking defaults.
- **Smart Realistic Defaults**: Pre-populates realistic standard fields (e.g. `BillingCity` for Account, `Email` for Contact, `StageName` and `CloseDate` for Opportunity).

---

## 💡 Examples

```bash
# Scaffold an Account factory (creates AccountDataFactory.cls)
hob create factory Account

# Scaffold a custom object factory (creates PropertyDataFactory.cls)
hob create factory Property__c

# Custom class name
hob create factory Contact -n ContactFixtureFactory

# Specific output directory
hob create factory Invoice -d ./force-app/main/default/classes
```

---

## 🧪 Usage in Apex Tests

```apex
@IsTest
private class OrderServiceTest {

    @IsTest
    static void testUnitBehaviorWithoutDml() {
        // Blazing fast unit test in-memory
        Account testAcc = AccountDataFactory.buildAccount();
        Assert.isNotNull(testAcc.Name);
    }

    @IsTest
    static void testIntegrationWithDml() {
        // Record inserted into database
        Account testAcc = AccountDataFactory.createAccount(new Map<String, Object>{
            'BillingCity' => 'Austin'
        });
        Assert.isNotNull(testAcc.Id);
    }

    @IsTest
    static void testBulkOperations() {
        // Bulk inserts 200 records
        List<Account> accounts = AccountDataFactory.createAccountList(200);
        Assert.areEqual(200, accounts.size());
    }
}
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `<sobject>` | | *(required)* | Target sObject API name (e.g. `Account`, `Contact`, `Property__c`) |
| `-n, --name <name>` | `-n` | `<SObject>DataFactory` | Custom class name |
| `-d, --output-dir <dir>` | `-d` | `force-app/main/default/classes` | Directory for saving the factory class |
| `--help` | `-h` | | Display help for the command |
