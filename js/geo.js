function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoibWdkNzIyIiwiYSI6ImNpbDRjaWRjODN5eHp1OWtzbWNtc2Zld3YifQ.vZlX9ZBALkMMYRyoEVNRUg';
    start_view = { lat: 39.05683297260771, lon: -108.69100755389508, zoom: 11.5 };

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/outdoors-v9',
        center: [start_view.lon, start_view.lat],
        zoom: start_view.zoom
    });

    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', addLayers);
}

function addLayers() {
    map.addSource("climbs", {
        "type": "geojson",
        "data": "data/colm-climbs-v2.geojson",
        "cluster": true,
        "clusterMaxZoom": 16, // Max zoom to cluster points on
        "clusterRadius": 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
        "id": "unclustered-points",
        "type": "symbol",
        "source": "climbs",
        "filter": ["!has", "point_count"],
        "layout": {
            "icon-image": "circle-15",
            "icon-allow-overlap": true,
            "text-field": "1",
            "text-font": [
                "DIN Offc Pro Medium",
                "Arial Unicode MS Bold"
            ],
            "text-size": 12
        },
        "paint": {
            "text-color": "white"
        }
    });

    // Display the data in three layers, each filtered to a range of
    // count values. Each range gets a different fill color.
    var layers = [
        [25, '#F26419'],
        [10, '#F6AE2D'],
        [0, '#86BBD8']
    ];

    layers.forEach(function(layer, i) {
        map.addLayer({
            "id": "cluster-" + i,
            "type": "circle",
            "source": "climbs",
            "paint": {
                "circle-color": layer[1],
                "circle-radius": 18
            },
            "filter": i === 0 ? [">=", "point_count", layer[0]] : ["all", [">=", "point_count", layer[0]],
                ["<", "point_count", layers[i - 1][0]]
            ]
        });
    });

    // Add a layer for the clusters' count labels
    map.addLayer({
        "id": "cluster-count",
        "type": "symbol",
        "source": "climbs",
        "layout": {
            "text-field": "{point_count}",
            "text-font": [
                "DIN Offc Pro Medium",
                "Arial Unicode MS Bold"
            ],
            "text-size": 12
        }
    });

    addEventListeners();
}

function addEventListeners() {
    map.on('click', function(e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-points'] });

        if (!features.length) {
            return;
        }

        var feature = features[0];
        var html = '<h5>' + feature.properties.Name + '</h5><table class="map-info-box">';
        html += '<tr><td>Difficulty</td><td>' + feature.properties.Difficulty + '</td></tr>';
        html += '<tr><td>Pitches</td><td>' + feature.properties.Pitches + '</td></tr>';
        html += '<tr><td>Type</td><td>' + feature.properties.Type + '</td></tr>';
        html += '<tr><td>Anchors</td><td>' + feature.properties.Anchors + '</td></tr>';
        html += '<tr><td>Fixed_Gear</td><td>' + feature.properties.Fixed_Gear + '</td></tr>';
        html += '<tr><td>Descent</td><td>' + feature.properties.Descent + '</td></tr>';
        html += '<tr><td>Height</td><td>' + feature.properties.Height_Ft + ' feet</tr>';
        html += '<tr><td>Trail</td><td>' + feature.properties.Trail + '</td></tr>';
        html += '<tr><td>Comments</td><td>' + feature.properties.Comments + '</td></tr>';
        html += '</table>';

        var popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(map);
    });

    // Use the same approach as above to indicate that the symbols are clickable
    // by changing the cursor style to 'pointer'.
    map.on('mousemove', function(e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-points', ] });
        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    });
}

function resetMap() {
    map.easeTo({ "center": [start_view.lon, start_view.lat], "zoom": start_view.zoom });
}

$(document).ready(function() {
    initMap();
});
