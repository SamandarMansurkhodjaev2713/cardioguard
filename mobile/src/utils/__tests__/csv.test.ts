import { escapeCsvCell, toCsv } from '../csv';

const BOM = String.fromCharCode(0xfeff);

describe('escapeCsvCell', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvCell('Алишер')).toBe('Алишер');
    expect(escapeCsvCell('120')).toBe('120');
  });
  it('quotes values containing a comma', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
  });
  it('quotes and doubles inner quotes', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });
  it('quotes values containing newlines', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('toCsv', () => {
  it('prepends a BOM and joins rows with CRLF', () => {
    const csv = toCsv([
      ['id', 'age'],
      ['P-1', '54'],
    ]);
    expect(csv.startsWith(BOM)).toBe(true);
    expect(csv).toBe(`${BOM}id,age\r\nP-1,54`);
  });
  it('escapes cells per row', () => {
    const csv = toCsv([['name', 'note'], ['X', 'a,b']]);
    expect(csv.endsWith('X,"a,b"')).toBe(true);
  });
});
