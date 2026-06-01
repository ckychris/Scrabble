const d = require('./src/data/sourceDictionary.json');
const allEntries = d.filter(e => e.v);
console.log('All entries in sourceDictionary with empty jyutping:');
const badEntries = allEntries.filter(e => !e.j || e.j.trim() === '');
console.log('Found', badEntries.length, 'entries');
badEntries.forEach(e => console.log({v: e.v, j: e.j, e: e.e}));
