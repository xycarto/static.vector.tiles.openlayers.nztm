// pop-up elemants
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var popTitle = document.getElementById('popTitle');
var popStory = document.getElementById('popStory');

// Layer for pop up
var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});

/**
 * Add a click handler to hide the popup.
 * @return {boolean} Don't follow the href.
 */
 closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
}


// set NZTM projection extent so OL can determine zoom level 0 extents.
// Define NZTM projection
proj4.defs("EPSG:2193","+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

// Register projection with OpenLayers
ol.proj.proj4.register(proj4);

// Create new OpenLayers projection
var proj2193 = new ol.proj.Projection({
	code: 'EPSG:2193',
	units: 'm',
	extent: [827933.23, 3729820.29, 3195373.59, 7039943.58]
});

// NZTM tile matrix origin, resolution and matrixId definitions.
var origin = [-1000000, 10000000];
var resolutions = [ 8960, 4480, 2240, 1120, 560, 280, 140, 70, 28, 14, 7, 2.8, 1.4, 0.7, 0.28, 0.14, 0.07 ];
var matrixIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];


// Tile Services Map
var urlTemplate =
  "https://tiles.maps.linz.io/nz_colour_basemap/NZTM/{z}/{x}/{y}.png";

// Set raster layer
var layer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: urlTemplate,
    projection: proj2193,
    attributions: ['<a href="http://data.linz.govt.nz">Data from LINZ. CC BY 4.0</a>'],
    tileGrid: new ol.tilegrid.TileGrid({
      origin: origin,
      resolutions: resolutions,
      matrixIds: matrixIds,
      extent: [827933.23, 3729820.29, 3195373.59, 7039943.58]
    })
  })
});

// Set vector layer
var placeSource = new ol.source.VectorTile({
  cacheSize: 0,
  overlaps: true,
  tilePixelRatio: 1, // oversampling when > 1
  tileGrid: new ol.tilegrid.TileGrid({ 
    origin: [-1000000, 10000000],
    maxZoom: 14,
    tileSize: 4096,
    extent: [827933.23, 3729820.29, 3195373.59, 7039943.58],
    resolutions: resolutions,
  }),
  extent: [827933.23, 3729820.29, 3195373.59, 7039943.58],
  format: new ol.format.MVT(),
  projection: ol.proj.get('EPSG:2193'),
  url: 'https://xycarto.github.io/static.vector.tiles.openlayers.nztm/tiles/wellyRegion_townBay_nztm/{z}/{x}/{y}.pbf'
});

var vectorMap = new ol.layer.VectorTile({
  declutter: true,
  source: placeSource,
  renderMode: 'vector',
  zIndex: 10
  })

// Add base map to HTML map container
var map = new ol.Map({
  target: 'map',
  layers: [layer, vectorMap],
  view: new ol.View({
    minZoom: 6,
    maxZoom: 11,
    center: ol.proj.transform(
      [174.7787, -41.2924],
      "EPSG:4326",
      "EPSG:2193"
    ),
    zoom: 10,
    projection: proj2193,
  })
});

// Add overlay for Popup window
map.addOverlay(overlay);

// Get JSON for vector tile styles and apply styling to vector tiles
fetch('./styleText.json').then(function(response) {
  response.json().then(function(glStyle) {
    olms.applyStyle(vectorMap, glStyle, 'wellyRegion_townBay_nztm');
  });
});

//Select Features
map.on('click', showInfo);

function showInfo(evt) {
  var coordinate = evt.coordinate;
  console.log(coordinate);
  
  var features = map.getFeaturesAtPixel(evt.pixel);

  if (!features.length) {
    content = {};
    overlay.changed();
    return;
  }

  console.log(features[0].getProperties().name_ascii);
  var title = features[0].getProperties().name_ascii;
  var desc = features[0].getProperties().desc_code;
  popTitle.innerHTML = title + '<hr>';
  popStory.innerHTML = title + ' is considered a ' + desc + ' by the LINZ geographic names layer. This pop up window demonstrates how we can collect data from the attibutes of a vector tile and display those results in a window.  The ' + desc + ' is taken directly from attibutes of the vector tile; as well as the ' + title + ' name.';

  overlay.setPosition(coordinate);
};