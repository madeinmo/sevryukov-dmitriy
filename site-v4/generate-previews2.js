import fs from 'fs';
import path from 'path';
import pdf2img from 'pdf-img-convert';

const inputDir = path.join(process.cwd(), '../initial');
const outputDir = path.join(process.cwd(), 'public/documents/previews');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));

files.sort((a, b) => {
  const numA = parseInt(a.split(' ')[0]) || parseInt(a.split('_')[0]) || 0;
  const numB = parseInt(b.split(' ')[0]) || parseInt(b.split('_')[0]) || 0;
  return numA - numB;
});

const docsInfo = [];

async function main() {
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const pdfPath = path.join(inputDir, filename);
    const id = `cert-${i + 1}`;
    const imagePath = path.join(outputDir, `${id}.jpg`);
    
    try {
      console.log(`Converting ${filename}...`);
      const outputImages = await pdf2img.convert(pdfPath, {
        width: 800, // good size for lightbox
        page_numbers: [1],
        base64: false
      });
      
      fs.writeFileSync(imagePath, outputImages[0]);
      console.log(`Done: ${imagePath}`);
    } catch (err) {
      console.error(`Failed: ${filename}`, err);
    }
    
    let displayName = filename.replace('.pdf', '');
    displayName = displayName.replace(/^\d+[\s_]+/, '').replace(/_/g, ' ').trim();
    
    docsInfo.push({
      id: id,
      name: displayName,
      image: `/documents/previews/${id}.jpg`,
      pdf: `/documents/${id}.pdf`
    });
  }
  
  fs.writeFileSync(
    path.join(process.cwd(), 'src/data/documents.json'), 
    JSON.stringify(docsInfo, null, 2)
  );
  
  console.log('All done!');
}

main();
