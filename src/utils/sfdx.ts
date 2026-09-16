import path from "node:path";
import fs from "node:fs";

export interface SfdxProjectInfo {
  isSfdxProject: boolean;
  projectRoot: string;
  defaultPackageDir: string;
  apiVersion: string;
  paths: {
    classes: string;
    triggers: string;
    lwc: string;
  };
}

/**
 * Searches current directory and parents for sfdx-project.json
 */
export function findSfdxProjectRoot(startDir: string = process.cwd()): string | null {
  let currentDir = path.resolve(startDir);

  while (true) {
    const sfdxConfigPath = path.join(currentDir, "sfdx-project.json");
    if (fs.existsSync(sfdxConfigPath)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached filesystem root
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Reads project configuration and returns standard paths and API version
 */
export function getSfdxProjectInfo(startDir: string = process.cwd()): SfdxProjectInfo {
  const root = findSfdxProjectRoot(startDir);
  const fallbackApiVersion = "63.0";

  if (!root) {
    return {
      isSfdxProject: false,
      projectRoot: process.cwd(),
      defaultPackageDir: "force-app",
      apiVersion: fallbackApiVersion,
      paths: {
        classes: path.resolve(process.cwd(), "classes"),
        triggers: path.resolve(process.cwd(), "triggers"),
        lwc: path.resolve(process.cwd(), "lwc")
      }
    };
  }

  let defaultPackageDir = "force-app";
  let apiVersion = fallbackApiVersion;

  try {
    const sfdxPath = path.join(root, "sfdx-project.json");
    const content = JSON.parse(fs.readFileSync(sfdxPath, "utf-8"));

    if (content.sourceApiVersion) {
      apiVersion = content.sourceApiVersion;
    }

    if (Array.isArray(content.packageDirectories)) {
      const defaultPkg = content.packageDirectories.find((pkg: any) => pkg.default === true);
      if (defaultPkg?.path) {
        defaultPackageDir = defaultPkg.path;
      } else if (content.packageDirectories.length > 0 && content.packageDirectories[0]?.path) {
        defaultPackageDir = content.packageDirectories[0].path;
      }
    }
  } catch {
    // Keep defaults on error
  }

  const basePackagePath = path.join(root, defaultPackageDir, "main", "default");

  return {
    isSfdxProject: true,
    projectRoot: root,
    defaultPackageDir,
    apiVersion,
    paths: {
      classes: path.join(basePackagePath, "classes"),
      triggers: path.join(basePackagePath, "triggers"),
      lwc: path.join(basePackagePath, "lwc")
    }
  };
}
