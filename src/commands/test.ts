import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import pc from "picocolors";
import ora from "ora";
import { logger } from "../utils/logger.js";
import { ensureCommand, runCommand } from "../utils/runner.js";
import { getSfdxProjectInfo } from "../utils/sfdx.js";
import {
  DEFAULT_TEST_WAIT,
  DEFAULT_TEST_COVERAGE
} from "../constants.js";
import {
  formatDuration,
  formatPercentage,
  formatUncoveredLines,
  renderProgressBar
} from "../utils/formatters.js";

export interface TestOptions {
  targetOrg?: string;
  coverage?: boolean;
  suite?: string | string[];
  tests?: string | string[];
  testLevel?: "RunLocalTests" | "RunAllTestsInOrg" | "RunSpecifiedTests";
  synchronous?: boolean;
  wait?: string;
  detailed?: boolean;
  outputDir?: string;
}

interface TestResultItem {
  Id?: string;
  MethodName: string;
  Outcome: "Pass" | "Fail" | "CompileFail" | "Skip";
  ApexClass?: {
    Id?: string;
    Name: string;
    NamespacePrefix?: string | null;
  };
  RunTime?: number;
  Message?: string | null;
  StackTrace?: string | null;
  FullName?: string;
}

interface CoverageItem {
  id?: string;
  name: string;
  totalLines: number;
  totalCovered: number;
  coveredPercent: number;
  uncoveredLines?: number[];
}

interface TestRunResult {
  summary: {
    outcome: string;
    testsRan: number;
    passing: number;
    failing: number;
    skipped: number;
    passRate: string;
    failRate: string;
    testStartTime?: string;
    testExecutionTimeInMs: number;
    testTotalTimeInMs?: number;
    commandTimeInMs?: number;
    testRunCoverage?: string;
    orgWideCoverage?: string;
    orgId?: string;
    username?: string;
  };
  tests: TestResultItem[];
  coverage?: {
    coverage: CoverageItem[];
  };
}

/**
 * Smart class targeting: If given "OrderService", resolves to "OrderServiceTest" if present
 */
function resolveTestClassTarget(inputClass: string, classesDir: string): string {
  const trimmed = inputClass.trim();
  if (!trimmed) return "";

  // If already specifies a method or ends with Test, leave as is
  if (trimmed.includes(".") || trimmed.endsWith("Test") || trimmed.endsWith("_Test")) {
    return trimmed;
  }

  // Check if companion test class exists locally
  const companionCandidate = `${trimmed}Test`;
  const companionPath = path.join(classesDir, `${companionCandidate}.cls`);

  if (fs.existsSync(companionPath)) {
    return companionCandidate;
  }

  return trimmed;
}

export function registerTestCommand(program: Command): void {
  program
    .command("test [class]")
    .description("Execute Apex unit tests with clean formatted terminal summaries and coverage indicators")
    .option("-o, --target-org <org>", "Target org username or alias (defaults to default org)")
    .option("-c, --coverage", "Collect and display code coverage (default: true)", DEFAULT_TEST_COVERAGE)
    .option("--no-coverage", "Disable code coverage calculation")
    .option("-s, --suite <suites...>", "Apex test suite name(s) to run")
    .option("-t, --tests <tests...>", "Apex test class or method name(s) to run")
    .option(
      "-l, --test-level <level>",
      "Test level (RunLocalTests, RunAllTestsInOrg, RunSpecifiedTests)"
    )
    .option("-y, --synchronous", "Run tests synchronously (default for single test class)")
    .option("--no-synchronous", "Force asynchronous test execution")
    .option("-w, --wait <minutes>", "Maximum time to wait for test results in minutes", DEFAULT_TEST_WAIT)
    .option("-d, --detailed", "Display detailed diagnostics and uncovered line numbers")
    .option("--output-dir <dir>", "Directory in which to store raw test result files")
    .action(async (positionalClass: string | undefined, options: TestOptions) => {
      logger.banner();

      await ensureCommand("sf", "Please install it via: npm install -g @salesforce/cli");

      const sfdxInfo = getSfdxProjectInfo();
      const classesDir = sfdxInfo.paths.classes;

      // Determine target tests
      const targetTests: string[] = [];
      if (positionalClass) {
        const resolved = resolveTestClassTarget(positionalClass, classesDir);
        targetTests.push(resolved);
      }

      if (options.tests) {
        const raw = Array.isArray(options.tests) ? options.tests : [options.tests];
        for (const item of raw) {
          const splitItems = item.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
          for (const s of splitItems) {
            targetTests.push(resolveTestClassTarget(s, classesDir));
          }
        }
      }

      // Build sf CLI arguments
      const sfArgs = ["apex", "run", "test", "--json"];

      if (options.targetOrg) {
        sfArgs.push("--target-org", options.targetOrg);
      }

      if (options.wait) {
        sfArgs.push("--wait", options.wait);
      }

      if (options.outputDir) {
        sfArgs.push("--output-dir", options.outputDir);
      }

      const shouldCollectCoverage = options.coverage !== false;
      if (shouldCollectCoverage) {
        sfArgs.push("--code-coverage");
      }

      if (targetTests.length > 0) {
        for (const test of targetTests) {
          sfArgs.push("--tests", test);
        }
        // Single test class runs faster synchronously
        if (targetTests.length === 1 && !targetTests[0].includes(",") && options.synchronous !== false) {
          sfArgs.push("--synchronous");
        }
      } else if (options.suite) {
        const suites = Array.isArray(options.suite) ? options.suite : [options.suite];
        for (const suite of suites) {
          sfArgs.push("--suite-names", suite);
        }
      } else {
        sfArgs.push("--test-level", options.testLevel || "RunLocalTests");
      }

      const targetDescription = targetTests.length > 0
        ? targetTests.join(", ")
        : options.suite
        ? `suite: ${Array.isArray(options.suite) ? options.suite.join(", ") : options.suite}`
        : "Local Tests";

      console.log();
      logger.elf(`Hob is preparing to cast unit test spells for '${pc.bold(pc.cyan(targetDescription))}'...`);
      console.log();

      const spinner = ora({
        text: `Hob is executing Apex tests in Salesforce...`,
        color: "magenta"
      }).start();

      let stdout = "";
      try {
        const res = await runCommand("sf", sfArgs);
        stdout = res.stdout;
      } catch (err: any) {
        // When tests fail, sf exits with code 100 but returns valid JSON with results
        if (err.stdout) {
          stdout = err.stdout;
        } else {
          // Extract JSON block if present in error message
          const jsonMatch = err.message?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            stdout = jsonMatch[0];
          } else {
            spinner.fail("Failed to execute Apex test run.");
            logger.error(err.message);
            process.exit(1);
          }
        }
      }

      spinner.stop();

      let parsed: { result?: TestRunResult; message?: string; name?: string };
      try {
        parsed = JSON.parse(stdout);
      } catch {
        logger.error("Could not parse test run output from Salesforce CLI.");
        console.log(stdout);
        process.exit(1);
      }

      const result = parsed.result;
      if (!result || !result.summary) {
        if (parsed.message) {
          logger.error(parsed.message);
        } else {
          logger.error("No test summary returned by Salesforce CLI.");
        }
        process.exit(1);
      }

      const { summary, tests = [], coverage } = result;
      const isSuccess = summary.failing === 0;

      // ==========================================
      // 1. Test Results Table
      // ==========================================
      console.log();
      console.log(pc.bold(pc.cyan("🧪 Test Execution Results:")));
      console.log();

      const colStatus = "Status".padEnd(8);
      const colName = "Test Name".padEnd(46);
      const colTime = "Time";

      console.log(pc.bold(pc.dim(`  ${colStatus}${colName}${colTime}`)));
      console.log(pc.dim(`  ${"─".repeat(6)}  ${"─".repeat(44)}  ${"─".repeat(10)}`));

      for (const t of tests) {
        const testName = t.FullName || (t.ApexClass?.Name ? `${t.ApexClass.Name}.${t.MethodName}` : t.MethodName);
        const duration = formatDuration(t.RunTime ?? 0);

        let statusSymbol = pc.green("✔ Pass");
        if (t.Outcome === "Fail" || t.Outcome === "CompileFail") {
          statusSymbol = pc.red("✖ Fail");
        } else if (t.Outcome === "Skip") {
          statusSymbol = pc.yellow("↷ Skip");
        }

        const formattedName = (t.Outcome === "Fail" || t.Outcome === "CompileFail")
          ? pc.bold(pc.red(testName.padEnd(46)))
          : pc.white(testName.padEnd(46));

        console.log(`  ${statusSymbol.padEnd(16)}${formattedName}  ${pc.dim(duration)}`);
      }
      console.log();

      // ==========================================
      // 2. Failure Diagnostics Section
      // ==========================================
      const failedTests = tests.filter((t) => t.Outcome === "Fail" || t.Outcome === "CompileFail");
      if (failedTests.length > 0) {
        console.log(pc.bold(pc.red("✖ Test Failures & Stack Traces:")));
        console.log();

        for (const fail of failedTests) {
          const failName = fail.FullName || (fail.ApexClass?.Name ? `${fail.ApexClass.Name}.${fail.MethodName}` : fail.MethodName);
          console.log(`  ${pc.bold(pc.red(`• ${failName}`))}`);
          if (fail.Message) {
            console.log(`    ${pc.bold("Message:")} ${pc.yellow(fail.Message)}`);
          }
          if (fail.StackTrace) {
            console.log(`    ${pc.bold("Stack:")}`);
            const lines = fail.StackTrace.split("\n");
            for (const l of lines) {
              console.log(`      ${pc.dim(l.trim())}`);
            }
          }
          console.log();
        }
      }

      // ==========================================
      // 3. Code Coverage Section
      // ==========================================
      const coverageList = coverage?.coverage ?? [];
      if (shouldCollectCoverage && coverageList.length > 0) {
        console.log(pc.bold(pc.cyan("📊 Apex Code Coverage:")));
        console.log();

        const colCovClass = "Class Name".padEnd(28);
        const colBar = "Coverage Bar".padEnd(24);
        const colPercent = "%".padStart(5);
        const colLines = "Lines (Cov/Total)".padStart(18);
        const colUncovered = "  Uncovered Lines";

        console.log(pc.bold(pc.dim(`  ${colCovClass}${colBar}${colPercent}${colLines}${colUncovered}`)));
        console.log(
          pc.dim(
            `  ${"─".repeat(26)}  ${"─".repeat(22)}  ${"─".repeat(5)}  ${"─".repeat(16)}  ${"─".repeat(20)}`
          )
        );

        for (const cov of coverageList) {
          const className = cov.name.padEnd(28);
          const percent = cov.coveredPercent ?? 0;
          const bar = renderProgressBar(percent, 18);
          const percentStr = formatPercentage(percent);
          const linesInfo = `(${cov.totalCovered}/${cov.totalLines})`.padStart(16);
          const uncovered = formatUncoveredLines(cov.uncoveredLines ?? []);

          console.log(`  ${pc.white(className)}[${bar}] ${percentStr}  ${pc.dim(linesInfo)}  ${uncovered}`);
        }
        console.log();

        // Coverage Summary Line
        const orgCoverage = summary.orgWideCoverage || summary.testRunCoverage;
        const testCoverage = summary.testRunCoverage || summary.orgWideCoverage;

        const testRunCovNum = parseFloat(testCoverage?.replace("%", "") || "0");
        const thresholdMet = testRunCovNum >= 75;

        console.log(
          `  ${pc.bold("Test Run Coverage:")} ${formatPercentage(testRunCovNum)} ` +
          pc.dim(`(Minimum requirement: 75%) `) +
          (thresholdMet ? pc.green("✔") : pc.red("✖ Below 75% threshold"))
        );
        if (summary.orgWideCoverage) {
          console.log(`  ${pc.bold("Org-Wide Coverage:")} ${pc.cyan(summary.orgWideCoverage)}`);
        }
        console.log();
      }

      // ==========================================
      // 4. Final Banner & Summary
      // ==========================================
      const totalTime = formatDuration(summary.testExecutionTimeInMs);
      const stats = `Total: ${summary.testsRan} | Passed: ${pc.green(summary.passing)} | Failed: ${summary.failing > 0 ? pc.red(summary.failing) : summary.failing} | Skipped: ${summary.skipped} | Duration: ${totalTime}`;

      console.log(pc.dim(`  ${"─".repeat(60)}`));
      console.log(`  ${pc.bold(stats)}`);
      console.log(pc.dim(`  ${"─".repeat(60)}`));
      console.log();

      if (isSuccess) {
        logger.success(`All Apex tests passed successfully in ${totalTime}!`);
        console.log();
        logger.elf("Hob tidied up the test suite and polished your code coverage reports! 🧦");
        console.log();
        process.exit(0);
      } else {
        logger.error(`Test run finished with ${summary.failing} failure(s).`);
        console.log();
        logger.elf("Hob found some tangled threads in your test results. Review the failures above! 🧦");
        console.log();
        process.exit(1);
      }
    });
}
