export type FieldType = 'Text' | 'Number' | 'Date' | 'Boolean' | 'Choice';
export type FormatType = 'Text' | 'Number' | 'Currency' | 'Percentage' | 'Date' | 'Boolean' | 'SingleSelect' | 'MultiSelect';
export type ObjectType = 'Entity' | 'Person';

export interface FieldDef {
  objectName: string;
  objectId: number;
  objectType: ObjectType;
  fieldName: string;
  fieldId: number;
  apiName: string;
  fieldType: FieldType;
  formatType: FormatType;
  systemFieldType: string;
  required: boolean;
  multiSelect: boolean;
  choiceValues: string[];
  referencedObjects: number[];
  isCalculated: boolean;
  isSystemField: boolean;
}

export interface EntryTypeDef {
  objectName: string;
  objectId: number;
  objectType: ObjectType;
  fields: FieldDef[];
}

// ─── Company ───────────────────────────────────────────────────────────────────
const companyFields: FieldDef[] = [
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Name', fieldId: 10001, apiName: 'Name', fieldType: 'Text', formatType: 'Text', systemFieldType: 'Name', required: true, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Address Line 1', fieldId: 10002, apiName: 'AddressLine1', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'City', fieldId: 10003, apiName: 'City', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'State', fieldId: 10004, apiName: 'State', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Postal Code', fieldId: 10005, apiName: 'PostalCode', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Description', fieldId: 10006, apiName: 'Description', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Phone Number', fieldId: 10007, apiName: 'PhoneNumber', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Website', fieldId: 10008, apiName: 'Website', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Year Founded', fieldId: 10009, apiName: 'YearFounded', fieldType: 'Number', formatType: 'Number', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Employee Count', fieldId: 10010, apiName: 'EmployeeCount', fieldType: 'Number', formatType: 'Number', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Revenue', fieldId: 10011, apiName: 'Revenue', fieldType: 'Number', formatType: 'Currency', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'EBITDA', fieldId: 10012, apiName: 'EBITDA', fieldType: 'Number', formatType: 'Currency', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Operating Status', fieldId: 10013, apiName: 'OperatingStatus', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['Active', 'Inactive', 'Acquired', 'Bankrupt', 'Dissolved'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Ownership Status', fieldId: 10014, apiName: 'OwnershipStatus', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['Private', 'Public', 'Non-Profit', 'Government', 'Subsidiary'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Employee Count Range', fieldId: 10015, apiName: 'EmployeeCountRange', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Investor Type', fieldId: 10016, apiName: 'InvestorType', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['Angel', 'VC', 'PE', 'Family Office', 'Corporate', 'Hedge Fund', 'Growth Equity'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'LinkedIn URL', fieldId: 10017, apiName: 'LinkedInURL', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Ticker', fieldId: 10018, apiName: 'Ticker', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Exchange', fieldId: 10019, apiName: 'Exchange', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Company', objectId: 65535, objectType: 'Entity', fieldName: 'Specialties', fieldId: 10020, apiName: 'Specialties', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
];

// ─── Contact ───────────────────────────────────────────────────────────────────
const contactFields: FieldDef[] = [
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Name', fieldId: 10101, apiName: 'Name', fieldType: 'Text', formatType: 'Text', systemFieldType: 'Name', required: true, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: true, isSystemField: true },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'First Name', fieldId: 10102, apiName: 'FirstName', fieldType: 'Text', formatType: 'Text', systemFieldType: 'FirstName', required: true, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Last Name', fieldId: 10103, apiName: 'LastName', fieldType: 'Text', formatType: 'Text', systemFieldType: 'LastName', required: true, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Business Email', fieldId: 10104, apiName: 'BusinessEmail', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Job Title', fieldId: 10105, apiName: 'JobTitle', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Direct Office', fieldId: 10106, apiName: 'DirectOffice', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Mobile Phone', fieldId: 10107, apiName: 'MobilePhone', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Address Line 1', fieldId: 10108, apiName: 'AddressLine1', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'City', fieldId: 10109, apiName: 'City', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'State', fieldId: 10110, apiName: 'State', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Postal Code', fieldId: 10111, apiName: 'PostalCode', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Alumni', fieldId: 10112, apiName: 'Alumni', fieldType: 'Boolean', formatType: 'Boolean', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Firm Employee', fieldId: 10113, apiName: 'FirmEmployee', fieldType: 'Boolean', formatType: 'Boolean', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Key Contact', fieldId: 10114, apiName: 'KeyContact', fieldType: 'Boolean', formatType: 'Boolean', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Title Level', fieldId: 10115, apiName: 'TitleLevel', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['C-Suite', 'VP', 'Director', 'Manager', 'Associate', 'Analyst', 'Partner'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Alumni Posture', fieldId: 10116, apiName: 'AlumniPosture', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['Promoter', 'Neutral', 'Detractor'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Current Capacity', fieldId: 10117, apiName: 'CurrentCapacity', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['Active', 'Passive', 'Not Looking'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Prefix', fieldId: 10118, apiName: 'Prefix', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Suffix', fieldId: 10119, apiName: 'Suffix', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'Middle Name', fieldId: 10120, apiName: 'MiddleName', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Contact', objectId: 65537, objectType: 'Person', fieldName: 'LinkedIn URL', fieldId: 10121, apiName: 'LinkedInURL', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
];

// ─── Opportunity ───────────────────────────────────────────────────────────────
const opportunityFields: FieldDef[] = [
  { objectName: 'Opportunity', objectId: 65565, objectType: 'Entity', fieldName: 'Opportunity Name', fieldId: 10201, apiName: 'Name', fieldType: 'Text', formatType: 'Text', systemFieldType: 'Name', required: true, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: true, isSystemField: false },
  { objectName: 'Opportunity', objectId: 65565, objectType: 'Entity', fieldName: 'Description', fieldId: 10202, apiName: 'Description', fieldType: 'Text', formatType: 'Text', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Opportunity', objectId: 65565, objectType: 'Entity', fieldName: 'Est. Fees', fieldId: 10203, apiName: 'EstimatedFees', fieldType: 'Number', formatType: 'Currency', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Opportunity', objectId: 65565, objectType: 'Entity', fieldName: 'Added Date', fieldId: 10204, apiName: 'AddedDate', fieldType: 'Date', formatType: 'Date', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Opportunity', objectId: 65565, objectType: 'Entity', fieldName: 'Estimated Win Date', fieldId: 10205, apiName: 'EstimatedWinDate', fieldType: 'Date', formatType: 'Date', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
];

// ─── Client ────────────────────────────────────────────────────────────────────
const clientFields: FieldDef[] = [
  { objectName: 'Client', objectId: 84596, objectType: 'Entity', fieldName: 'Name', fieldId: 10301, apiName: 'Name', fieldType: 'Text', formatType: 'Text', systemFieldType: 'Name', required: true, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: true, isSystemField: false },
  { objectName: 'Client', objectId: 84596, objectType: 'Entity', fieldName: 'Client Status', fieldId: 10302, apiName: 'ClientStatus', fieldType: 'Choice', formatType: 'SingleSelect', systemFieldType: '', required: false, multiSelect: false, choiceValues: ['Active', 'Inactive', 'Prospect', 'Former'], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Client', objectId: 84596, objectType: 'Entity', fieldName: 'Client Open On', fieldId: 10303, apiName: 'ClientOpenOn', fieldType: 'Date', formatType: 'Date', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Client', objectId: 84596, objectType: 'Entity', fieldName: 'Client Closed On', fieldId: 10304, apiName: 'ClientClosedOn', fieldType: 'Date', formatType: 'Date', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Client', objectId: 84596, objectType: 'Entity', fieldName: 'Client Total WIP', fieldId: 10305, apiName: 'ClientTotalWIP', fieldType: 'Number', formatType: 'Currency', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Client', objectId: 84596, objectType: 'Entity', fieldName: 'Client Total AR', fieldId: 10306, apiName: 'ClientTotalAR', fieldType: 'Number', formatType: 'Currency', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
  { objectName: 'Client', objectId: 84596, objectType: 'Entity', fieldName: 'Client Last WIP', fieldId: 10307, apiName: 'ClientLastWIP', fieldType: 'Number', formatType: 'Currency', systemFieldType: '', required: false, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
];

// ─── Matter ────────────────────────────────────────────────────────────────────
const matterFields: FieldDef[] = [
  { objectName: 'Matter', objectId: 84588, objectType: 'Entity', fieldName: 'Name', fieldId: 10401, apiName: 'Name', fieldType: 'Text', formatType: 'Text', systemFieldType: 'Name', required: true, multiSelect: false, choiceValues: [], referencedObjects: [], isCalculated: false, isSystemField: false },
];

// ─── Registry ─────────────────────────────────────────────────────────────────
export const entryTypes: EntryTypeDef[] = [
  { objectName: 'Company',     objectId: 65535, objectType: 'Entity', fields: companyFields },
  { objectName: 'Contact',     objectId: 65537, objectType: 'Person', fields: contactFields },
  { objectName: 'Opportunity', objectId: 65565, objectType: 'Entity', fields: opportunityFields },
  { objectName: 'Client',      objectId: 84596, objectType: 'Entity', fields: clientFields },
  { objectName: 'Matter',      objectId: 84588, objectType: 'Entity', fields: matterFields },
];

export function getFieldIdsForEntryType(objectId: number): number[] {
  const et = entryTypes.find(e => e.objectId === objectId);
  return et ? et.fields.map(f => f.fieldId) : [];
}

export function getWritableFields(objectId: number): FieldDef[] {
  const et = entryTypes.find(e => e.objectId === objectId);
  if (!et) return [];
  return et.fields.filter(f => !f.isCalculated && !f.isSystemField);
}
