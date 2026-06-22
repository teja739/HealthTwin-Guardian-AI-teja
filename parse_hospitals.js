const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\saiam\\.cache\\kagglehub\\datasets\\himanshunegi2000\\hospitals-in-india-dataset\\versions\\1\\HospitalsInIndia.csv';
const outputPath = path.join(__dirname, 'src', 'lib', 'hospitals_india.json');

console.log('Reading CSV from:', csvPath);
try {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  console.log('Headers:', headers);

  const hospitals = [];
  // Parse lines (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser supporting quotes
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    
    // We can also split by comma if there are no quotes, but to be safe:
    // Let's parse comma separated values, handling quotes
    const values = [];
    let currentVal = '';
    let insideQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim().replace(/^"|"$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^"|"$/g, ''));

    if (values.length >= 6) {
      const hospitalName = values[1];
      const state = values[2];
      const city = values[3];
      const address = values[4];
      const pincode = values[5];

      hospitals.push({
        name: hospitalName,
        state,
        city,
        address,
        pincode
      });
    }
  }

  console.log(`Parsed ${hospitals.length} hospitals.`);
  
  // Write to JSON
  fs.writeFileSync(outputPath, JSON.stringify(hospitals.slice(0, 500), null, 2), 'utf8');
  console.log('Saved parsed JSON to:', outputPath);

} catch (err) {
  console.error('Error parsing CSV:', err);
}
