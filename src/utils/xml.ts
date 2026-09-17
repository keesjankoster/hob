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

export interface CustomObjectOptions {
  label: string;
  pluralLabel: string;
  description?: string;
  nameFieldType?: "Text" | "AutoNumber";
  nameFieldLabel?: string;
  autoNumberFormat?: string;
  sharingModel?: "ReadWrite" | "Private" | "Read";
  deploymentStatus?: "Deployed" | "InDevelopment";
}

export function generateCustomObjectMeta(options: CustomObjectOptions): string {
  const nameFieldType = options.nameFieldType || "Text";
  const nameFieldLabel = options.nameFieldLabel || (nameFieldType === "AutoNumber" ? `${options.label} Number` : `${options.label} Name`);
  const sharingModel = options.sharingModel || "ReadWrite";
  const deploymentStatus = options.deploymentStatus || "Deployed";

  let nameFieldXml = "";
  if (nameFieldType === "AutoNumber") {
    const displayFormat = options.autoNumberFormat || `${options.label.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "OBJ")}-{0000}`;
    nameFieldXml = `    <nameField>
        <displayFormat>${displayFormat}</displayFormat>
        <label>${nameFieldLabel}</label>
        <type>AutoNumber</type>
    </nameField>`;
  } else {
    nameFieldXml = `    <nameField>
        <label>${nameFieldLabel}</label>
        <type>Text</type>
    </nameField>`;
  }

  const descXml = options.description ? `\n    <description>${options.description}</description>` : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>${options.label}</label>
    <pluralLabel>${options.pluralLabel}</pluralLabel>${descXml}
${nameFieldXml}
    <deploymentStatus>${deploymentStatus}</deploymentStatus>
    <sharingModel>${sharingModel}</sharingModel>
</CustomObject>
`;
}

export type CustomFieldType =
  | "Text"
  | "Number"
  | "Currency"
  | "Checkbox"
  | "Date"
  | "DateTime"
  | "Picklist"
  | "LongTextArea"
  | "Lookup"
  | "Percent"
  | "Email"
  | "Phone"
  | "Url";

export interface CustomFieldOptions {
  fullName: string;
  label: string;
  type: CustomFieldType;
  description?: string;
  inlineHelpText?: string;
  required?: boolean;
  unique?: boolean;
  externalId?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  picklistValues?: string[];
  referenceTo?: string;
  relationshipName?: string;
  relationshipLabel?: string;
  defaultValue?: string;
}

export function generateCustomFieldMeta(options: CustomFieldOptions): string {
  const lines: string[] = [
    `    <fullName>${options.fullName}</fullName>`,
    `    <label>${options.label}</label>`,
    `    <type>${options.type}</type>`
  ];

  if (options.description) {
    lines.push(`    <description>${options.description}</description>`);
  }
  if (options.inlineHelpText) {
    lines.push(`    <inlineHelpText>${options.inlineHelpText}</inlineHelpText>`);
  }

  const isRequired = options.required ?? false;
  if (options.type !== "Checkbox") {
    lines.push(`    <required>${isRequired}</required>`);
  }

  if (options.externalId !== undefined) {
    lines.push(`    <externalId>${options.externalId}</externalId>`);
  }
  if (options.unique !== undefined) {
    lines.push(`    <unique>${options.unique}</unique>`);
  }

  switch (options.type) {
    case "Text":
      lines.push(`    <length>${options.length || 255}</length>`);
      break;
    case "LongTextArea":
      lines.push(`    <length>${options.length || 32768}</length>`);
      lines.push(`    <visibleLines>3</visibleLines>`);
      break;
    case "Number":
    case "Currency":
      lines.push(`    <precision>${options.precision ?? 18}</precision>`);
      lines.push(`    <scale>${options.scale ?? 2}</scale>`);
      break;
    case "Percent":
      lines.push(`    <precision>${options.precision ?? 5}</precision>`);
      lines.push(`    <scale>${options.scale ?? 2}</scale>`);
      break;
    case "Checkbox":
      lines.push(`    <defaultValue>${options.defaultValue === "true"}</defaultValue>`);
      break;
    case "Picklist": {
      const values = options.picklistValues && options.picklistValues.length > 0
        ? options.picklistValues
        : ["Default Value"];
      const valueEntries = values
        .map(
          (val) => `            <value>
                <fullName>${val}</fullName>
                <default>false</default>
                <label>${val}</label>
            </value>`
        )
        .join("\n");
      lines.push(`    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
${valueEntries}
        </valueSetDefinition>
    </valueSet>`);
      break;
    }
    case "Lookup":
      if (options.referenceTo) {
        lines.push(`    <referenceTo>${options.referenceTo}</referenceTo>`);
      }
      if (options.relationshipName) {
        lines.push(`    <relationshipName>${options.relationshipName}</relationshipName>`);
      }
      if (options.relationshipLabel) {
        lines.push(`    <relationshipLabel>${options.relationshipLabel}</relationshipLabel>`);
      }
      lines.push(`    <deleteConstraint>SetNull</deleteConstraint>`);
      break;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
${lines.join("\n")}
</CustomField>
`;
}

export interface PermissionSetMetaOptions {
  label: string;
  description?: string;
  hasActivationRequired?: boolean;
  license?: string;
  objects?: string[];
  classes?: string[];
}

export function generatePermissionSetMeta(options: PermissionSetMetaOptions): string {
  const lines: string[] = [
    `    <hasActivationRequired>${options.hasActivationRequired ?? false}</hasActivationRequired>`,
    `    <label>${options.label}</label>`
  ];

  if (options.description) {
    lines.push(`    <description>${options.description}</description>`);
  }
  if (options.license) {
    lines.push(`    <license>${options.license}</license>`);
  }

  if (options.classes && options.classes.length > 0) {
    for (const cls of options.classes) {
      lines.push(`    <classAccesses>
        <apexClass>${cls}</apexClass>
        <enabled>true</enabled>
    </classAccesses>`);
    }
  }

  if (options.objects && options.objects.length > 0) {
    for (const obj of options.objects) {
      lines.push(`    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>true</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>false</modifyAllRecords>
        <object>${obj}</object>
        <viewAllRecords>true</viewAllRecords>
    </objectPermissions>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
${lines.join("\n")}
</PermissionSet>
`;
}

export interface CustomMetadataTypeOptions {
  label: string;
  pluralLabel: string;
  description?: string;
  visibility?: "Public" | "Protected";
}

export function generateCustomMetadataTypeMeta(options: CustomMetadataTypeOptions): string {
  const descXml = options.description ? `\n    <description>${options.description}</description>` : "";
  const visibility = options.visibility || "Public";

  return `<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>${options.label}</label>
    <pluralLabel>${options.pluralLabel}</pluralLabel>${descXml}
    <visibility>${visibility}</visibility>
</CustomObject>
`;
}

export interface CustomMetadataRecordOptions {
  label: string;
  isProtected?: boolean;
}

export function generateCustomMetadataRecordMeta(options: CustomMetadataRecordOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <label>${options.label}</label>
    <protected>${options.isProtected ?? false}</protected>
</CustomMetadata>
`;
}
