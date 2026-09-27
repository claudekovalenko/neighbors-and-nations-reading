// The 66 books in canonical order: [USFM code, display name, ...other names].
export const BOOKS = [
  ['GEN', 'Genesis', 'gen', 'gn'], ['EXO', 'Exodus', 'exod', 'ex'], ['LEV', 'Leviticus', 'lev'],
  ['NUM', 'Numbers', 'num'], ['DEU', 'Deuteronomy', 'deut', 'dt'], ['JOS', 'Joshua', 'josh'],
  ['JDG', 'Judges', 'judg'], ['RUT', 'Ruth'], ['1SA', '1 Samuel', '1 sam'], ['2SA', '2 Samuel', '2 sam'],
  ['1KI', '1 Kings', '1 kgs'], ['2KI', '2 Kings', '2 kgs'], ['1CH', '1 Chronicles', '1 chron', '1 chr'],
  ['2CH', '2 Chronicles', '2 chron', '2 chr'], ['EZR', 'Ezra'], ['NEH', 'Nehemiah', 'neh'],
  ['EST', 'Esther', 'esth'], ['JOB', 'Job'], ['PSA', 'Psalms', 'psalm', 'ps', 'psa'],
  ['PRO', 'Proverbs', 'prov', 'pr'], ['ECC', 'Ecclesiastes', 'eccl', 'ecc'],
  ['SNG', 'Song of Solomon', 'song of songs', 'song'], ['ISA', 'Isaiah', 'isa'], ['JER', 'Jeremiah', 'jer'],
  ['LAM', 'Lamentations', 'lam'], ['EZK', 'Ezekiel', 'ezek'], ['DAN', 'Daniel', 'dan'], ['HOS', 'Hosea', 'hos'],
  ['JOL', 'Joel'], ['AMO', 'Amos'], ['OBA', 'Obadiah', 'obad'], ['JON', 'Jonah'], ['MIC', 'Micah', 'mic'],
  ['NAM', 'Nahum', 'nah'], ['HAB', 'Habakkuk', 'hab'], ['ZEP', 'Zephaniah', 'zeph'], ['HAG', 'Haggai', 'hag'],
  ['ZEC', 'Zechariah', 'zech'], ['MAL', 'Malachi', 'mal'],
  ['MAT', 'Matthew', 'matt', 'mt'], ['MRK', 'Mark', 'mk'], ['LUK', 'Luke', 'lk'], ['JHN', 'John', 'jn'],
  ['ACT', 'Acts', 'acts of the apostles'], ['ROM', 'Romans', 'rom'], ['1CO', '1 Corinthians', '1 cor'],
  ['2CO', '2 Corinthians', '2 cor'], ['GAL', 'Galatians', 'gal'], ['EPH', 'Ephesians', 'eph'],
  ['PHP', 'Philippians', 'phil'], ['COL', 'Colossians', 'col'], ['1TH', '1 Thessalonians', '1 thess'],
  ['2TH', '2 Thessalonians', '2 thess'], ['1TI', '1 Timothy', '1 tim'], ['2TI', '2 Timothy', '2 tim'],
  ['TIT', 'Titus'], ['PHM', 'Philemon', 'philem'], ['HEB', 'Hebrews', 'heb'], ['JAS', 'James', 'jas'],
  ['1PE', '1 Peter', '1 pet'], ['2PE', '2 Peter', '2 pet'], ['1JN', '1 John'], ['2JN', '2 John'],
  ['3JN', '3 John'], ['JUD', 'Jude'], ['REV', 'Revelation', 'rev', 'revelations'],
];

const norm = (s) => s.toLowerCase().replace(/\./g, '').replace(/^(i{1,3})\s/, (m, r) => `${r.length} `).replace(/\s+/g, ' ').trim();

const LOOKUP = new Map();
BOOKS.forEach(([code, ...names], i) => {
  for (const n of [code, ...names]) LOOKUP.set(norm(n), { code, name: names[0], index: i });
});

export function findBook(name) {
  return LOOKUP.get(norm(name)) ?? null;
}
