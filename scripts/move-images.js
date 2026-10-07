const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'npics');
const targetDir = path.join(__dirname, '..', 'public', 'images');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Check if source directory exists
if (!fs.existsSync(sourceDir)) {
  console.log('No "npics" directory found. Skipping image processing.');
  process.exit(0);
}

const files = fs.readdirSync(sourceDir);

if (files.length === 0) {
  console.log('The "npics" directory is empty.');
  process.exit(0);
}

let movedCount = 0;

files.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);

  // Only move files, not directories
  if (fs.statSync(sourcePath).isFile()) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied: ${file} -> public/images/${file}`);
    movedCount++;
  }
});

console.log(`Successfully copied ${movedCount} images!`);
