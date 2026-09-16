/**
 * Salesforce Metadata XML template generators
 */

export function generateApexClassMeta(apiVersion: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexClass>
`;
}

export function generateApexTriggerMeta(apiVersion: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${apiVersion}</apiVersion>
    <status>Active</status>
</ApexTrigger>
`;
}

export interface LwcMetaOptions {
  apiVersion: string;
  isExposed: boolean;
  masterLabel: string;
  description: string;
  targets: string[];
}

export function generateLwcBundleMeta(options: LwcMetaOptions): string {
  let targetsXml = "";
  if (options.targets.length > 0) {
    targetsXml = `\n    <targets>\n${options.targets
      .map((target) => `        <target>${target}</target>`)
      .join("\n")}\n    </targets>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>${options.apiVersion}</apiVersion>
    <isExposed>${options.isExposed}</isExposed>
    <masterLabel>${options.masterLabel}</masterLabel>
    <description>${options.description}</description>${targetsXml}
</LightningComponentBundle>
`;
}
