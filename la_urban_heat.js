// Los Angeles urban heat visualization using Landsat 8 Collection 2 Level 2
// Cleaned version: LST map + NDVI map + binned NDVI/LST line chart
// Water / negative-NDVI pixels removed from the chart

// -----------------------------
// 1. Define region of interest
// -----------------------------
var la = ee.Geometry.Rectangle([-118.75, 33.65, -117.65, 34.35]);
Map.centerObject(la, 10);

// -----------------------------
// 2. Load Landsat 8 Level 2 data
// -----------------------------
var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(la)
  .filterDate('2023-06-01', '2023-09-30')
  .filter(ee.Filter.lt('CLOUD_COVER', 20));

// -----------------------------
// 3. Cloud mask + scaling
// -----------------------------
function maskL8(image) {
  var qa = image.select('QA_PIXEL');

  // Mask cirrus, cloud, cloud shadow, snow
  var mask = qa.bitwiseAnd(1 << 2).eq(0)
    .and(qa.bitwiseAnd(1 << 3).eq(0))
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 5).eq(0));

  // Scale optical reflectance bands
  var optical = image.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'])
    .multiply(0.0000275)
    .add(-0.2);

  // Scale surface temperature to Celsius
  var lstC = image.select('ST_B10')
    .multiply(0.00341802)
    .add(149.0)
    .subtract(273.15)
    .rename('LST_C');

  return image.addBands(optical, null, true)
              .addBands(lstC)
              .updateMask(mask);
}

var processed = collection.map(maskL8);

// -----------------------------
// 4. Create median summer composite
// -----------------------------
var image = processed.median().clip(la);

// -----------------------------
// 5. Calculate NDVI
// -----------------------------
var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');

// -----------------------------
// 6. Visualization parameters
// -----------------------------
var lstViz = {
  min: 20,
  max: 50,
  palette: ['blue', 'cyan', 'green', 'yellow', 'orange', 'red']
};

var ndviViz = {
  min: 0,
  max: 0.8,
  palette: ['brown', 'yellow', 'green']
};

// -----------------------------
// 7. Add layers to map
// -----------------------------
Map.addLayer(image.select('LST_C'), lstViz, 'Land Surface Temp (°C)');
Map.addLayer(ndvi, ndviViz, 'NDVI');
Map.addLayer(
  image.select(['SR_B4', 'SR_B3', 'SR_B2']),
  {min: 0.05, max: 0.3},
  'True Color',
  false
);

// -----------------------------
// 8. Combine NDVI and LST
// -----------------------------
var combined = ndvi.addBands(image.select('LST_C'));

// Remove water / negative NDVI / noisy values for charting
var valid = combined.updateMask(ndvi.gte(0.05).and(ndvi.lte(0.8)));

// -----------------------------
// 9. Sample pixels for chart
// -----------------------------
var samples = valid.sample({
  region: la,
  scale: 30,
  numPixels: 10000,
  geometries: false
});

// -----------------------------
// 10. Create NDVI bins (0.1 intervals)
// -----------------------------
var binned = samples.map(function(f) {
  var ndviVal = ee.Number(f.get('NDVI'));
  var bin = ndviVal.multiply(10).floor().divide(10);
  return f.set('NDVI_bin', bin);
});

// -----------------------------
// 11. Get mean LST for each NDVI bin
// -----------------------------
var grouped = ee.List(
  binned.reduceColumns({
    selectors: ['NDVI_bin', 'LST_C'],
    reducer: ee.Reducer.mean().group({
      groupField: 0,
      groupName: 'NDVI_bin'
    })
  }).get('groups')
);

// -----------------------------
// 12. Convert grouped results to features
// -----------------------------
var features = ee.FeatureCollection(grouped.map(function(item) {
  item = ee.Dictionary(item);
  return ee.Feature(null, {
    NDVI_bin: item.get('NDVI_bin'),
    mean_LST: item.get('mean')
  });
})).sort('NDVI_bin');

// -----------------------------
// 13. Make line chart
// -----------------------------
var lineChart = ui.Chart.feature.byFeature(features, 'NDVI_bin', ['mean_LST'])
  .setChartType('LineChart')
  .setOptions({
    title: 'Average Land Surface Temperature by NDVI Bin',
    hAxis: {title: 'NDVI'},
    vAxis: {title: 'Average LST (°C)'},
    lineWidth: 3,
    pointSize: 6,
    legend: {position: 'none'}
  });

print(lineChart);

// -----------------------------
// 14. Optional export
// -----------------------------
Export.image.toDrive({
  image: image.select('LST_C'),
  description: 'LA_LST_Summer_2023',
  region: la,
  scale: 30,
  maxPixels: 1e13
});
