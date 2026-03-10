import type { FieldDef } from './dealcloud-schema';

export type SampleRecord = Record<string, string | number | boolean | null>;

// ─── Data pools ───────────────────────────────────────────────────────────────
const firstNames = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','William','Barbara','David','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Christopher','Lisa','Daniel','Nancy'];
const lastNames  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White'];
const companyNames = ['Apex Capital','Blue Ridge Partners','Cornerstone Ventures','Delta Equity','Evergreen Holdings','Frontier Capital','Global Advisors','Harbor Group','Irongate Partners','Juniper Capital','Keystone Investments','Lighthouse Partners','Meridian Capital','Northgate Holdings','Oakwood Partners','Pacific Ventures','Quantum Capital','Redwood Group','Summit Partners','Titan Holdings','United Capital','Valley Partners','Western Equity','Zenith Capital'];
const clientNames = ['Apex Law Group','Blue Ridge Legal','Cornerstone Counsel','Delta Partners LLP','Evergreen Advisors','Frontier Law','Global Legal Group','Harbor Legal Partners'];
const opportunityNames = ['Series A Investment','Growth Equity Round','Buyout Transaction','Recapitalization','Add-on Acquisition','Platform Investment','Real Estate Deal','Credit Facility'];
const cities  = ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville'];
const states  = ['NY','CA','IL','TX','AZ','PA','TX','CA','TX','CA','TX','FL'];
const streets = ['Main St','Oak Ave','Park Blvd','Market St','Broadway','Elm St'];
const jobTitles = ['Chief Executive Officer','Chief Financial Officer','Managing Director','Vice President','Director','Senior Manager','Portfolio Manager','Investment Analyst','Associate','Principal','Partner','General Counsel'];
const descriptions = [
  'A leading private equity firm focused on middle-market companies.',
  'Specialized investment firm with deep sector expertise.',
  'Global alternative asset management company.',
  'Growth equity firm targeting technology and healthcare sectors.',
  'Multi-strategy investment firm with a 20-year track record.',
];
const prefixes = ['Mr.','Ms.','Dr.','Prof.'];
const suffixes = ['Jr.','Sr.','III','Esq.',''];
const exchanges = ['NYSE','NASDAQ','AMEX','OTC','LSE'];

let runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function resetRunId() {
  runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randCurrency() {
  // $50K – $50M
  return Math.round(Math.random() * 49_950_000 + 50_000);
}

function randDate() {
  const start = new Date(2020, 0, 1).getTime();
  const end   = new Date(2026, 0, 1).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
}

function randPhone() {
  return `(${randInt(200, 999)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`;
}

function randEmail(first: string, last: string, company: string) {
  const domain = company.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) || 'firm';
  return `${first.toLowerCase()}.${last.toLowerCase()}@${domain}.com`;
}

function generateTextValue(field: FieldDef): string {
  switch (field.apiName) {
    case 'Name':
      if (field.objectName === 'Client') return `${pick(clientNames)} ${runId}`;
      if (field.objectName === 'Opportunity') return `${pick(opportunityNames)} ${runId}`;
      if (field.objectName === 'Matter') return `Matter ${runId}-${randInt(1000, 9999)}`;
      return `${pick(companyNames)} ${runId}`;
    case 'FirstName':    return pick(firstNames);
    case 'LastName':     return pick(lastNames);
    case 'MiddleName':   return pick(firstNames).charAt(0) + '.';
    case 'Prefix':       return pick(prefixes);
    case 'Suffix':       return pick(suffixes) || '';
    case 'BusinessEmail':return randEmail(pick(firstNames), pick(lastNames), pick(companyNames));
    case 'JobTitle':     return pick(jobTitles);
    case 'Phone':
    case 'PhoneNumber':
    case 'DirectOffice':
    case 'MobilePhone':  return randPhone();
    case 'Address':
    case 'AddressLine1': return `${randInt(100, 9999)} ${pick(streets)}`;
    case 'City': {
      const i = randInt(0, cities.length - 1);
      return cities[i];
    }
    case 'State': {
      const i = randInt(0, states.length - 1);
      return states[i];
    }
    case 'PostalCode':   return String(randInt(10000, 99999));
    case 'Description':  return pick(descriptions);
    case 'Website':      return `https://www.${pick(companyNames).toLowerCase().replace(/\s/g, '')}.com`;
    case 'LinkedInURL':  return `https://linkedin.com/in/${pick(firstNames).toLowerCase()}-${pick(lastNames).toLowerCase()}-${randInt(100, 999)}`;
    case 'Ticker':       return pick(['AAPL','MSFT','GOOG','AMZN','META','TSLA','NFLX','NVDA']).slice(0, 4);
    case 'Exchange':     return pick(exchanges);
    case 'Specialties':  return ['Technology', 'Healthcare', 'Finance', 'Real Estate', 'Energy'].slice(0, randInt(1, 3)).join(', ');
    default:             return `${field.fieldName} ${randInt(1, 999)}`;
  }
}

function generateNumberValue(field: FieldDef): number {
  if (field.formatType === 'Currency') return randCurrency();
  if (field.formatType === 'Percentage') return Math.round(Math.random() * 100);
  if (field.apiName === 'YearFounded') return randInt(1950, 2023);
  if (field.apiName === 'EmployeeCount') return randInt(10, 100000);
  return randInt(1, 10000);
}

function generateFieldValue(field: FieldDef): string | number | boolean | null {
  switch (field.fieldType) {
    case 'Text':    return generateTextValue(field);
    case 'Number':  return generateNumberValue(field);
    case 'Date':    return randDate();
    case 'Boolean': return Math.random() < 0.5;
    case 'Choice':
      if (!field.choiceValues.length) return null;
      if (field.multiSelect) {
        const count = randInt(1, Math.min(3, field.choiceValues.length));
        return [...field.choiceValues].sort(() => Math.random() - 0.5).slice(0, count).join(', ');
      }
      return pick(field.choiceValues);
    default:
      return null;
  }
}

export function generateSampleRecord(fields: FieldDef[]): SampleRecord {
  const record: SampleRecord = {};
  for (const field of fields) {
    if (field.isSystemField || field.isCalculated) continue;
    record[field.apiName] = generateFieldValue(field);
  }
  return record;
}

export function generateSampleRecords(fields: FieldDef[], count: number): SampleRecord[] {
  return Array.from({ length: count }, () => generateSampleRecord(fields));
}

export function toRowApiPayload(
  record: SampleRecord,
  fields: FieldDef[],
): Record<string, unknown> {
  const payload: Record<string, unknown> = { EntryId: -1 };
  for (const field of fields) {
    if (field.fieldType === 'Choice') continue;
    if (field.isCalculated || field.isSystemField) continue;
    const value = record[field.apiName];
    if (value === undefined || value === null) continue;
    // DealCloud REST v4 expects date values as full ISO 8601 datetime strings
    // (e.g. "2021-07-14T00:00:00.000Z"), not bare date strings or Unix timestamps.
    if (field.fieldType === 'Date' && typeof value === 'string') {
      const ms = Date.parse(value);
      if (!isNaN(ms)) {
        payload[field.apiName] = new Date(ms).toISOString();
        continue;
      }
    }
    payload[field.apiName] = value;
  }
  return payload;
}
