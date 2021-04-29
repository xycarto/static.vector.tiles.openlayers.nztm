# Static Vector Tiles: Openlayers Example in Custom Projection with Raster Tile Base

This example uses Openlayers6. The map is served in the NZTM projection (EPSG:2193).  The main goal is loading an existing raster tile XYZ tile cache and overlay a vector tile styled with a Mapbox style.json; all in NZTM. No effort has been made in ordering the labels. They display however the Openlayers `decluttering` orders them. Included is an example of a basic pop-up window demonstrating how to get information from the vector tile.

The project is built as a static set up.  The vector tile cache is built directly into the website. THIS IS NOT OPTIMAL, but does demonstrate the principle. Ideally, you would have a location like AWS S3, to serve your tile cache from.  

In order to use a custom projection, you will need to build an XYZ tile cache.  MBTiles do not handle projections other than Web Mercator (EPSG:3857)

## Site example 

https://xycarto.github.io/static.vector.tiles.openlayers.nztm/

## Basic steps

1. Download or reproject shapefile NZTM
2. Upload shapefile to PostgreSQL database with PostGIS extensions
3. Tile PostgreSQL table into NZTM (EPSG:2193) XYZ tile cache using TRex
4. Construct Openlayers6 JS for tile consuption

## Sample Data

https://data.linz.govt.nz/layer/50280-nz-geographic-names-topo-150k/

Note:

The Geographic Names layer is clipped and filtered for this example. I clipped only to the Wellington Region and filtered the data only to use:

```
desc_code = BAY, METR, LOC, POP, TOWN, SBRB
```

## TRex Tiling

[TRex](https://t-rex.tileserver.ch) will create an XYZ tile cache in the projection of your choosing.  You will need to know the resolutions and bounding box of your projection in order to make this work. I was fortunate to have this information at hand thanks to a great turtorial from [LINZ](https://www.linz.govt.nz/data/linz-data-service/guides-and-documentation/nztm2000-map-tile-service-schema). 

TRex uses a config file for tiling.  The config used in this example is [here](https://github.com/xycarto/static.vector.tiles.openlayers.nztm/blob/main/config/configpsql_points.toml)

The command used to run TREX:

```
t_rex generate --progress true --maxzoom=14 --minzoom=0 --extent=174.627603,-41.613839,176.259896,-40.737190  --config /configpsql_points.toml
```


TRex will generate `gzip` pfb's.  If you prefer to unzip them:


```find . -type f | xargs -n1 -P 1 -t -I % gzip -d -r -S .pbf %```

```find . -type f | xargs -n1 -P 1 -t -I % % %.pbf```

## Openlayers JS

The Openlayers for this is version 6.  `<script>` tags needed are:

```
<script src="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.5.0/build/ol.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.15/proj4.js"></script>
<script src="https://unpkg.com/ol-mapbox-style@6.3.2/dist/olms.js" type="text/javascript"></script>
```


Some of the imporant bits for the JS. 

For the full JS example see: https://github.com/xycarto/static.vector.tiles.openlayers.nztm/blob/main/main.js

### NZTM Construct in Openlayers

Building the projection for Openlayers

```
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
```


### Applying to Raster and Vector Tiles

#### Raster Tiles

Another great tutorial from [LINZ](https://www.linz.govt.nz/data/linz-data-service/guides-and-documentation/using-lds-xyz-services-in-openlayers) regarding the set up of an XYZ for raster tiles. 

```
// Tile Services Map
var urlTemplate =
  "https://tiles.maps.linz.io/nz_colour_basemap/NZTM/{z}/{x}/{y}.png";

// Set raster layer
var layer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: urlTemplate,
    projection: proj2193,
    tileGrid: new ol.tilegrid.TileGrid({
      origin: origin,
      resolutions: resolutions,
      matrixIds: matrixIds,
      extent: [827933.23, 3729820.29, 3195373.59, 7039943.58]
    })
  })
});
```

#### Vector Tiles

Set up the vector layer to use custom projection: 

```
// Set vector layer
var placeSource = new ol.source.VectorTile({
  cacheSize: 0,
  overlaps: true,
  tilePixelRatio: 1, // oversampling when > 1
  tileGrid: new ol.tilegrid.TileGrid({ 
    origin: [-1000000, 10000000],
    maxZoom: 16,
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
```


### Styling

For the style file example see here: https://github.com/xycarto/static.vector.tiles.openlayers.nztm/blob/main/styleText.json

1. The method in this example is loading the vector tile and overaying it on a raster tile cache.  In order to accomplish this, a vector tile cache must be loaded first to the map, THEN the rules from the style JOSN are applied using:

```
fetch('./styleText.json').then(function(response) {
  response.json().then(function(glStyle) {
    olms.applyStyle(vectorMap, glStyle, 'wellyRegion_townBay_wgs');
  });
});
```


2. The above uses `olms.applyStyle`. To access this function you will need to add the scipt tag to your HTML:

```<script src="https://unpkg.com/ol-mapbox-style@6.3.2/dist/olms.js" type="text/javascript"></script>```

## Notes

