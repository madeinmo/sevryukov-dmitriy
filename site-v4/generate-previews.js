import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

// Path to the worker
const workerSrc = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const inputDir = path.join(process.cwd(), '../initial');
const outputDir = path.join(process.cwd(), 'public/documents/previews');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));

// Try to sort them by the leading number if present
files.sort((a, b) => {
  const numA = parseInt(a.split(' ')[0]) || parseInt(a.split('_')[0]) || 0;
  const numB = parseInt(b.split(' ')[0]) || parseInt(b.split('_')[0]) || 0;
  return numA - numB;
});

const docsInfo = [];

async function convertPdfToImage(pdfPath, imagePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    // Get the first page
    const page = await pdfDocument.getPage(1);
    
    // Scale
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    
    // Render
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
    
    // Save to file
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.8 });
    fs.writeFileSync(imagePath, buffer);
    console.log(`Converted: ${path.basename(pdfPath)} -> ${path.basename(imagePath)}`);
    return true;
  } catch (err) {
    console.error(`Error converting ${pdfPath}:`, err);
    return false;
  }
}

async function main() {
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const pdfPath = path.join(inputDir, filename);
    const id = `cert-${i + 1}`;
    const imagePath = path.join(outputDir, `${id}.jpg`);
    
    await convertPdfToImage(pdfPath, imagePath);
    
    // Clean up name for display
    let displayName = filename.replace('.pdf', '');
    // Remove leading numbers and underscores
    displayName = displayName.replace(/^\d+[\s_]+/, '').replace(/_/g, ' ').trim();
    
    docsInfo.push({
      id: id,
      name: displayName,
      image: `/documents/previews/${id}.jpg`,
      pdf: `/documents/${id}.pdf`
    });
  }
  
  // Save metadata
  fs.writeFileSync(
    path.join(process.cwd(), 'src/data/documents.json'), 
    JSON.stringify(docsInfo, null, 2)
  );
  
  console.log('Done!');
}

main();
