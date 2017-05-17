var geo = {
    map: null,
    start_view: { lat: 39.05683297260771, lon: -108.69100755389508, zoom: 11.5 },
    initMap: function() {
        mapboxgl.accessToken = 'pk.eyJ1IjoibWdkNzIyIiwiYSI6ImNpbDRjaWRjODN5eHp1OWtzbWNtc2Zld3YifQ.vZlX9ZBALkMMYRyoEVNRUg';

        geo.map = new mapboxgl.Map({
            container: 'app-maparea',
            style: 'mapbox://styles/mapbox/outdoors-v9',
            center: [geo.start_view.lon, geo.start_view.lat],
            zoom: geo.start_view.zoom
        });

        geo.map.addControl(new mapboxgl.NavigationControl());

        geo.map.loadImage('media/icons/red-marker.png', function(error, img) {
            geo.map.addImage('red-marker', img);
        });
    },
    addLayer: function(name, geojsonPoints) {

        geo.map.on('load', function() {
            geo.map.addSource(name, {
                "type": "geojson",
                "data": geojsonPoints
            });

            geo.map.addLayer({
                "id": "highlighted",
                "type": "symbol",
                "source": name,
                "layout": {
                    "icon-image": "red-marker",
                    "icon-allow-overlap": true,
                    "icon-ignore-placement": true,
                    "icon-size": 0.3
                },
                'filter': ["==", 'highlighted', true]
            });
        });
    },
    addEventListeners: function() {
        geo.map.on('click', function(e) {
            var features = geo.map.queryRenderedFeatures(e.point, { layers: ['highlighted'] });

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
                .addTo(geo.map);
        });

        // Use the same approach as above to indicate that the symbols are clickable
        // by changing the cursor style to 'pointer'.
        geo.map.on('mousemove', function(e) {
            var features = geo.map.queryRenderedFeatures(e.point, { layers: ['highlighted', ] });
            geo.map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
        });
    },
    resetMap: function() {
        geo.map.easeTo({ "center": [geo.start_view.lon, geo.start_view.lat], "zoom": geo.start_view.zoom });
    }
};
