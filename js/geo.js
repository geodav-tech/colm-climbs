var geo = {
    map: null,
    initMap: function() {
        mapboxgl.accessToken = 'pk.eyJ1IjoibWdkNzIyIiwiYSI6ImNpbDRjaWRjODN5eHp1OWtzbWNtc2Zld3YifQ.vZlX9ZBALkMMYRyoEVNRUg';
        var start_view = { lat: 39.05683297260771, lon: -108.69100755389508, zoom: 11.5 };

        geo.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/outdoors-v9',
            center: [start_view.lon, start_view.lat],
            zoom: start_view.zoom
        });

        geo.map.addControl(new mapboxgl.NavigationControl());

    },
    addLayer: function(name, geojsonPoints) {
        geo.map.on('load', function() {
            geo.map.addSource(name, {
                "type": "geojson",
                "data": geojsonPoints
            });

            geo.map.addLayer({
                "id": name + "-highlighted",
                "type": "symbol",
                "source": name,
                "layout": {
                    "icon-image": "circle-15",
                    "icon-allow-overlap": true,
                    "icon-ignore-placement": true
                },
                'filter': ["==", 'highlighted', true]
            });

            geo.map.addLayer({
                "id": name + "-greyed",
                "type": "symbol",
                "source": name,
                "layout": {
                    "icon-image": "circle-15",
                    "icon-allow-overlap": true
                },
                "paint": {
                    "icon-opacity": 0.5,
                    "icon-color": 'red'
                },
                'filter': ["==", 'highlighted', false]
            });
        });
    },
    addEventListeners: function() {
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
    },
    resetMap: function() {
        map.easeTo({ "center": [start_view.lon, start_view.lat], "zoom": start_view.zoom });
    }
};
