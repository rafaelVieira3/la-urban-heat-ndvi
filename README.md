# Los Angeles Urban Heat & Vegetation Analysis

Google Earth Engine (JavaScript) | Landsat 8 Collection 2 Level-2 | Summer 2023 imagery

## Question
How does vegetation cover (NDVI) relate to land surface temperature (LST) across the Los Angeles area?

## Data
- Landsat 8 OLI/TIRS Collection 2 Level-2 (`LANDSAT/LC08/C02/T1_L2`), surface reflectance and surface temperature
- Date range: June 1 to September 30, 2023, scenes with under 20% cloud cover
- Study area: rectangle from about -118.75, 33.65 to -117.65, 34.35 (longitude, latitude)

## Method
1. Filtered the collection to the study area, date range, and cloud cover threshold.
2. Masked cirrus, cloud, cloud shadow, and snow using bits 2 to 5 of `QA_PIXEL`.
3. Applied Level-2 scale factors: reflectance (x 0.0000275 - 0.2) and surface temperature (x 0.00341802 + 149.0, converted from Kelvin to Celsius).
4. Built a median composite of the summer scenes and clipped it to the study area.
5. Computed NDVI from bands 5 (NIR) and 4 (red).
6. Mapped LST and NDVI, and kept a true-color layer for reference.
7. For the chart, kept pixels with NDVI between 0.05 and 0.8, sampled 10,000 pixels at 30 m, grouped them into 0.1-wide NDVI bins, and averaged LST in each bin.

## Results
- From the NDVI 0.2 bin to the NDVI 0.7 bin, mean land surface temperature fell steadily from about 42 C to about 32 C, roughly 9 to 10 C cooler where vegetation is densest.
- Below NDVI 0.2 the pattern is flat (about 40 C), so the relationship is not linear across the full range. Possible causes include mixed pixels, shadowed or coastal areas, and bare ground; I did not test these.
- Values above are read from the chart; replace with exact numbers from the Earth Engine console.
<img width="716" height="549" alt="lst_map" src="https://github.com/user-attachments/assets/8af4bb0a-c7f1-4ee7-84d6-7b7a4025a2ca" />

<img width="716" height="545" alt="ndvi_map" src="https://github.com/user-attachments/assets/1930b7ff-4560-4b21-9a68-be0b97ae67c0" />

<img width="939" height="342" alt="ndvi_lst_bins" src="https://github.com/user-attachments/assets/5c04b469-8cc5-4fca-b9bd-0fc9fcae90af" />

st_bins.png)

## Run it yourself
- Earth Engine script: [[paste share link]](https://code.earthengine.google.com/ba850374858d7562fbd138c4e956c9fe)
- The script also exports the LST layer to Google Drive as a 30 m GeoTIFF.

## Limitations
- One summer (2023) and one sensor; this is a snapshot, not a trend.
- The chart excludes pixels with NDVI below 0.05, which removes water but also much bare ground and dense pavement. Those surfaces are often the hottest, so the chart describes vegetated land and likely understates urban heat overall.
- Because bins use floor rounding, the lowest bin (0.0) only covers NDVI from 0.05 to 0.1.
- The chart uses a random 10,000-pixel sample, so exact values can shift slightly between runs.
- LST is skin temperature measured at satellite overpass time (late morning), not air temperature or heat exposure for people.
- The study area is a rectangle, not an administrative boundary.

## Skills shown
Remote sensing, cloud masking, spectral indices, land surface temperature, sampling and aggregation, map and chart production.

Author: Rafael Vieira | UCLA Geography, B.A. 2026
