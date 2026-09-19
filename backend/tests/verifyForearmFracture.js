import { processRadiographFilm } from '../medical-engine/vision/fractureEngine.js';

async function runTests() {
  const images = [
    {
      name: 'Forearm (Dual-View)',
      path: 'E:/clone app/backend/uploads/patient/PAT1001/report-1788338624256-173417135.jpg'
    },
    {
      name: 'Hand (Proximal Phalanx)',
      path: 'E:/clone app/backend/uploads/patient/PAT1001/report-1788337819774-859376870.png'
    }
  ];

  for (const img of images) {
    console.log('=================================================');
    console.log(`TESTING: ${img.name}`);
    const res = await processRadiographFilm({
      filePath: img.path,
      fileName: img.name,
      extractedDoc: { fullText: '' }
    });

    console.log('Anatomical Region:', res.anatomicalRegion);
    console.log('Total Fractures Count:', res.totalFracturesCount);
    console.log('Image Dimensions:', res.imageDimensions);
    res.fractures?.forEach((f, i) => {
      console.log(`  ${f.label} (${f.anatomicalSite}):`);
      console.log(`     Coordinates: X=${f.coordinates.x}, Y=${f.coordinates.y}, W=${f.coordinates.width}, H=${f.coordinates.height}`);
      console.log(`     Center Point: (${f.coordinates.centerX}, ${f.coordinates.centerY})`);
      console.log(`     Confidence: ${f.confidence}%`);
    });
    console.log('Annotated URL:', res.annotatedImageUrl);
  }
}

await runTests();
