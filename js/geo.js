var geo = {
    map: null,
    start_view: { lon: -108.7036313776697, lat: 39.04929205588982, zoom: 11.5 },
    popup: null,
    initMap: function() {
        mapboxgl.accessToken = 'pk.eyJ1IjoibWdkNzIyIiwiYSI6ImNpbDRjaWRjODN5eHp1OWtzbWNtc2Zld3YifQ.vZlX9ZBALkMMYRyoEVNRUg';

        geo.map = new mapboxgl.Map({
            container: 'app-maparea',
            style: 'mapbox://styles/mapbox/outdoors-v9',
            center: [geo.start_view.lon, geo.start_view.lat],
            zoom: geo.start_view.zoom,
            maxZoom: 19
        });

        geo.map.addControl(new mapboxgl.NavigationControl());

        geo.map.loadImage('media/icons/red-marker.png', function(error, img) {
            geo.map.addImage('red-marker', img);
        });
    },
    addLayer: function(geojsonPoints) {
        // ease to new bounds (shouldn't be far from initial extent)
        var bbox = geo.addCosmeticPadding(turf.bbox(geojsonPoints));
        geo.map.fitBounds(bbox);

        geo.map.on('load', function() {
            geo.map.addSource('climbs', {
                "type": "geojson",
                "data": geojsonPoints,
                "cluster": true,
                "clusterMaxZoom": 14, // Max zoom to cluster points on
                "clusterRadius": 50 // Radius of each cluster when clustering points (defaults to 50)
            });

            geo.map.addLayer({
                "id": "unclustered-climbs",
                "type": "symbol",
                "source": 'climbs',
                "filter": ["!has", "point_count"],
                "layout": {
                    "icon-image": "red-marker",
                    "icon-allow-overlap": true,
                    "icon-ignore-placement": true,
                    "icon-size": 0.2
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
                geo.map.addLayer({
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
            geo.map.addLayer({
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

        });
    },
    _makePopup: function(screenPoint, features) {
        if (screenPoint) {
            features = geo.map.queryRenderedFeatures(screenPoint, { layers: ['unclustered-climbs'] });
        }

        if (!features.length) {
            return;
        }

        var feature = features[0];
        var html = '<h5>' + feature.properties.Name + '</h5><table>';
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

        geo.popup = new mapboxgl.Popup()
            .setLngLat(feature.geometry.coordinates)
            .setHTML(html)
            .addTo(geo.map);
    },
    addEventListeners: function() {
        geo.map.on('click', function(e) {
            // if there's a single climb visible there, open its popup
            geo._makePopup(e.point);

            // zoom in a bit if a cluster is clicked
            cluster = geo.map.queryRenderedFeatures(e.point, { layers: ['cluster-0', 'cluster-1', 'cluster-2'] });
            if (cluster.length) {
                var center = cluster[0].geometry.coordinates;
                geo.map.easeTo({ center: center, zoom: geo.map.getZoom() * 1.16 });
            }
        });

        // Use the same approach as above to indicate that the symbols are clickable
        // by changing the cursor style to 'pointer'.
        geo.map.on('mousemove', function(e) {
            var features = geo.map.queryRenderedFeatures(e.point, { layers: ['unclustered-climbs', 'cluster-0', 'cluster-1', 'cluster-2'] });
            geo.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
        });
    },
    addCosmeticPadding: function(bbox) {
        // takes a geojson bbox and adds a slight percentage of padding to it so that all points draw wholly inbounds
        bbox[0] *= 1.00005;
        bbox[1] *= 0.99995;
        bbox[2] *= 0.99995;
        bbox[3] *= 1.00005;

        return bbox;
    },
    zoomSingleClimb: function(lat, lon, id) {
        // if on mobile, scroll up to map before zooming
        if ($('.page-switch-icon').css('display') !== 'none') {
            $('html, body').animate({
                scrollTop: $('#app-maparea').offset().top
            }, 500);
        }

        geo.clearPopup();
        geo.map.easeTo({ center: [lon, lat], zoom: 15.5 });
        geo.map.once('moveend', function() {
            geo._makePopup(null, geo.map.querySourceFeatures('climbs', { filter: ["==", 'ID', id] }));
        });
    },
    clearPopup: function() {
        if (geo.popup) {
            geo.popup.remove();
        }
    }
};
