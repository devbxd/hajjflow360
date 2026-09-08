// Parses the Machine Readable Zone (MRZ) of a passport (TD3 format: two
// 44-character lines) out of raw OCR text. OCR on a photographed passport is
// never perfect, so this is best-effort — the UI must let staff review and
// correct every extracted field before saving.

export interface ParsedPassport {
  passportNumber?: string;
  nationalityCode?: string;
  surname?: string;
  givenNames?: string;
  dateOfBirth?: string; // DD/MM/YYYY
  gender?: 'M' | 'F';
  passportExpiry?: string; // DD/MM/YYYY
}

function mrzDateToDMY(mrzDate: string): string | undefined {
  if (!/^\d{6}$/.test(mrzDate)) return undefined;
  const yy = parseInt(mrzDate.slice(0, 2), 10);
  const mm = mrzDate.slice(2, 4);
  const dd = mrzDate.slice(4, 6);
  // MRZ years are 2-digit; treat 00-30 as 2000s, 31-99 as 1900s (passports
  // rarely span further back for date-of-birth than that in this dataset).
  const year = yy <= 30 ? 2000 + yy : 1900 + yy;
  return `${dd}/${mm}/${year}`;
}

function findMrzLines(rawText: string): [string, string] | null {
  const candidates = rawText
    .split('\n')
    .map((l) => l.toUpperCase().replace(/[^A-Z0-9<]/g, ''))
    .filter((l) => l.length >= 30 && /^[A-Z0-9<]+$/.test(l) && l.includes('<'));

  for (let i = 0; i < candidates.length - 1; i++) {
    const line1 = candidates[i];
    const line2 = candidates[i + 1];
    if (line1.startsWith('P<') && /^[A-Z0-9<]{28,44}$/.test(line2)) {
      return [line1.padEnd(44, '<').slice(0, 44), line2.padEnd(44, '<').slice(0, 44)];
    }
  }
  return null;
}

export function parsePassportMrz(rawText: string): ParsedPassport {
  const lines = findMrzLines(rawText);
  if (!lines) return {};
  const [line1, line2] = lines;

  const result: ParsedPassport = {};

  // Line 1: P<CCCSURNAME<<GIVEN<NAMES<<<<<<<<<<<<<<<<<<<<
  const nameSection = line1.slice(5);
  const [surnamePart, givenPart] = nameSection.split('<<');
  if (surnamePart) result.surname = surnamePart.replace(/</g, ' ').trim();
  if (givenPart) result.givenNames = givenPart.replace(/</g, ' ').trim();
  const countryCode = line1.slice(2, 5).replace(/</g, '');
  if (countryCode) result.nationalityCode = countryCode;

  // Line 2: passport number (9) + check(1) + nationality(3) + DOB(6) + check(1) + sex(1) + expiry(6) + check(1) + ...
  const passportNumberRaw = line2.slice(0, 9).replace(/</g, '');
  if (passportNumberRaw) result.passportNumber = passportNumberRaw;

  const dob = mrzDateToDMY(line2.slice(13, 19));
  if (dob) result.dateOfBirth = dob;

  const sex = line2[20];
  if (sex === 'M' || sex === 'F') result.gender = sex;

  const expiry = mrzDateToDMY(line2.slice(21, 27));
  if (expiry) result.passportExpiry = expiry;

  return result;
}
