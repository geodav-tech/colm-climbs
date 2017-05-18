var typePieChart = dc.pieChart("#type-pie-chart");
var classPieChart = dc.pieChart("#class-pie-chart");
var gradeBarChart = dc.barChart('#grade-bar-chart');
var pitchesRowChart = dc.rowChart('#pitches-row-chart');


$.getJSON('data/colm-climbs-v3.geojson', function(data) {

    geo.initMap();
    geo.addLayer(data);
    geo.map.on('load', geo.addEventListeners);

    var ndx = crossfilter(data.features);

    var typeDim = ndx.dimension(function(d) {
        return d.properties.Type;
    });
    var total_by_type = typeDim.group();

    var classDim = ndx.dimension(function(d) {
        return d.properties.ClimbClass;
    });
    var total_by_class = classDim.group();

    var filteredObjs = ndx.dimension(function(d) {
        return d;
    });

    var difficultyDim = ndx.dimension(function(d) {
        var diff = d.properties.Difficulty.split(' ')[0].replace('+', '').replace('-', '');
        if (diff == 'unknown') {
            return '?';
        } else if (diff == '5.6' || diff == '5.2') {
            return '<= 5.6';
        } else {
            return diff;
        }
    });
    var total_by_difficulty = difficultyDim.group();

    var pitchesDim = ndx.dimension(function(d) {
        return d.properties.Pitches;
    });
    var total_by_pitches = pitchesDim.group();

    typePieChart
        .width($(typePieChart.anchor()).parent().width() - 7).height($(typePieChart.anchor()).parent().width() - 7)
        .dimension(typeDim)
        .group(total_by_type);

    classPieChart
        .width($(classPieChart.anchor()).parent().width() - 7).height($(classPieChart.anchor()).parent().width() - 7)
        .dimension(classDim)
        .group(total_by_class);

    gradeBarChart
        .width($(gradeBarChart.anchor()).parent().width())
        .height(180)
        .margins({ top: 10, left: 25, right: 10, bottom: 20 })
        .dimension(difficultyDim)
        .group(total_by_difficulty)
        .elasticY(true)
        .gap(1)
        .alwaysUseRounding(true)
        .x(d3.scale.ordinal().domain(['<= 5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12', '5.13', '?']))
        .xUnits(dc.units.ordinal)
        .renderHorizontalGridLines(true);

    pitchesRowChart
        .width($(pitchesRowChart.anchor()).parent().width())
        .height(180)
        .margins({ top: 10, left: 10, right: 10, bottom: 20 })
        .group(total_by_pitches)
        .dimension(pitchesDim)
        .ordinalColors(['#1f77b4'])
        .label(function(d) {
            return d.key;
        })
        .title(function(d) {
            return d.value;
        })
        .elasticX(true);

    // attach event listener to each chart to show/hide filter elsewhere in the DOM
    dc.chartRegistry.list().forEach(function(chart) {
        chart.on('filtered', function() {
            if (chart.hasFilter()) {
                $(chart.anchor()).closest('.chart-wrapper').find('.reset').removeClass('hidden');
            } else {
                $(chart.anchor()).closest('.chart-wrapper').find('.reset').addClass('hidden');
            }

            // update the data displayed by all layers in the map to only include the data we've filtered to
            geo.map.getSource('climbs').setData({
                "type": "FeatureCollection",
                "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
                "features": filteredObjs.top(Infinity)
            });

        });
    });

    dc.renderAll();
});
