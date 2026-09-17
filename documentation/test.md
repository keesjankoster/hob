# 🧪 Running Apex Tests & Coverage

[← Back to Documentation](README.md)

Execute Apex unit tests with clean, formatted terminal summaries, failure stack traces, and visual code coverage indicators:

```bash
hob test [class] [options]
```

---

## 📖 Description

Running tests via raw Salesforce CLI commands often results in cluttered terminal outputs or raw JSON blobs.

**Hob Test** provides a refined developer testing experience:
- **Smart Target Resolution**: If you run `hob test OrderService`, Hob automatically checks if companion test class `OrderServiceTest.cls` exists in your project and targets it.
- **Fast Synchronous Execution**: Targeted single-class tests automatically run in synchronous mode for near-instant execution.
- **Visual Code Coverage Progress Bars**: Color-coded coverage bars (`[████████████████░░░░] 82%`) benchmarked against the 75% Salesforce deployment threshold (Green >= 75%, Yellow 60–74%, Red < 60%).
- **Formatted Failure Diagnostics**: Failed assertions and exceptions are highlighted with error messages and readable stack traces with line numbers.
- **CI/CD Friendly**: Exits with status code `1` if any test fails, making it ideal for continuous integration pipelines and git hooks.

---

## 💡 Examples

```bash
# Run all local tests in the default org
hob test

# Run a specific service class (auto-resolves to OrderServiceTest)
hob test OrderService

# Run a specific test class directly
hob test OrderServiceTest

# Run a specific test method
hob test OrderServiceTest.testCreateOrder

# Run tests in a specific scratch org or sandbox
hob test OrderService -o my-scratch

# Run a test suite
hob test -s BillingSuite

# Run without code coverage (faster execution)
hob test OrderService --no-coverage

# Display detailed diagnostics and uncovered line numbers
hob test OrderService --detailed
```

---

## 📊 Terminal Summary Example

```text
🧪 Test Execution Results:

  Status    Test Name                                     Time
  ──────    ────────────────────────────────────────────  ──────────
  ✔ Pass    OrderServiceTest.testCreateOrder              45ms
  ✔ Pass    OrderServiceTest.testCancelOrder              32ms
  ✖ Fail    OrderServiceTest.testRefundOrder              88ms

✖ Test Failures & Stack Traces:

  • OrderServiceTest.testRefundOrder
    Message: System.AssertException: Assertion Failed: Expected status REFUNDED
    Stack:
      Class.OrderService.processRefund: line 84, column 1
      Class.OrderServiceTest.testRefundOrder: line 42, column 1

📊 Apex Code Coverage:

  Class Name                  Coverage Bar            %   Lines (Cov/Total)    Uncovered Lines
  ──────────────────────────  ──────────────────────  ─────  ────────────────   ────────────────────
  OrderService                [████████████████░░░░]    80%         (20/25)     14, 22-25
  PaymentGateway              [████████████████████]   100%         (15/15)     None
  NotificationUtil            [████████░░░░░░░░░░░░]    40%          (4/10)     5-10

  Test Run Coverage:   82% (Minimum requirement: 75%) ✔
  Org-Wide Coverage: 84%

  ────────────────────────────────────────────────────────────
  Total: 3 | Passed: 2 | Failed: 1 | Skipped: 0 | Duration: 165ms
  ────────────────────────────────────────────────────────────
```

---

## ⚙️ Options

| Option | Shorthand | Default | Description |
| :--- | :--- | :--- | :--- |
| `[class]` | | *(optional)* | Target Apex class, test class, or method (e.g. `OrderService`, `OrderServiceTest.testCreate`) |
| `-o, --target-org <org>` | `-o` | Default org | Target org username or alias |
| `-c, --coverage` | `-c` | `true` | Collect and display code coverage |
| `--no-coverage` | | `false` | Disable code coverage calculation for faster execution |
| `-s, --suite <suites...>` | `-s` | | Apex test suite name(s) to run |
| `-t, --tests <tests...>` | `-t` | | Specific test class or method name(s) to run |
| `-l, --test-level <level>` | `-l` | `RunLocalTests` | Test level (`RunLocalTests`, `RunAllTestsInOrg`, `RunSpecifiedTests`) |
| `-y, --synchronous` | `-y` | `true` for single | Run tests synchronously |
| `--no-synchronous` | | | Force asynchronous test execution |
| `-w, --wait <minutes>` | `-w` | `10` | Maximum time to wait for test run completion |
| `-d, --detailed` | `-d` | `false` | Display uncovered line numbers per class and detailed diagnostics |
| `--output-dir <dir>` | | | Directory in which to store raw test result files |
| `--help` | `-h` | | Display help for the command |
