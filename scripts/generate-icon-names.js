const fs = require('fs');
const path = require('path');

// Read from dynamicIconImports — this is the authoritative source of icon names
// that DynamicIcon actually recognises (kebab-case keys).
const src = fs.readFileSync(
    require.resolve('lucide-react/dist/esm/dynamicIconImports.js'),
    'utf-8'
);

// Extract all quoted keys: "icon-name"
const names = [...new Set(
    Array.from(src.matchAll(/"([a-z0-9-]+)"/g), m => m[1])
)].sort();

const outPath = path.join(__dirname, '..', 'src', 'lib', 'iconNames.ts');
const content = `// Auto-generated from lucide-react/dynamicIconImports. Do not edit manually.\n// Run: node scripts/generate-icon-names.js\nexport const iconNames: string[] = ${JSON.stringify(names)};\n`;

fs.writeFileSync(outPath, content);
console.log(`Generated ${names.length} icon names -> src/lib/iconNames.ts`);
