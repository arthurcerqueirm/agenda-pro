const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /\bsage-light\b/g, to: 'primary-light' },
    { from: /\bsage-dark\b/g, to: 'primary-dark' },
    { from: /\bsage\b/g, to: 'primary' },
    { from: /\bcream-light\b/g, to: 'surface-light' },
    { from: /\bcream-dark\b/g, to: 'surface-neutral' },
    { from: /\bcream\b/g, to: 'surface' },
    { from: /\brose-light\b/g, to: 'danger-light' },
    { from: /\brose-dark\b/g, to: 'danger-dark' },
    { from: /\brose\b/g, to: 'danger' }
];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            for (const { from, to } of replacements) {
                newContent = newContent.replace(from, to);
            }

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Replacement complete.');
