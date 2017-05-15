var typePieChart = dc.pieChart("#type-pie-chart");
var gradeBarChart = dc.barChart('#grade-bar-chart');


$.getJSON('data/colm-climbs-v3.geojson', function(data) {

    data.features.forEach(function(d) {
        d.properties.highlighted = true;
    });

    geo.initMap();
    geo.addLayer('climbs', data);

    ndx = crossfilter(data.features);

    var typeDim = ndx.dimension(function(d) {
        return d.properties.Type;
    });
    var total_by_type = typeDim.group();

    var filteredObjs = ndx.dimension(function(d) {
        return d;
    });

    var gradeDim = ndx.dimension(function(d) {
        var diff = d.properties.Difficulty.split(' ')[0].replace('+', '').replace('-', '');
        if (diff == 'unknown') {
            return '?';
        } else if (diff == '5.6' || diff == '5.2') {
            return '<= 5.6';
        } else {
            return diff;
        }
    });
    var total_by_grade = gradeDim.group().reduceSum(function(d) {
        return 1;
    });

    typePieChart
        .width(150).height(150)
        .dimension(typeDim)
        .group(total_by_type);

    gradeBarChart
        .width(420)
        .height(180)
        .margins({ top: 10, right: 50, bottom: 30, left: 40 })
        .dimension(gradeDim)
        .group(total_by_grade)
        .elasticY(true)
        // (_optional_) whether bar should be center to its x value. Not needed for ordinal chart, `default=false`
        // .centerBar(true)
        // (_optional_) set gap between bars manually in px, `default=2`
        .gap(1)
        // (_optional_) set filter brush rounding
        .alwaysUseRounding(true)
        .x(d3.scale.ordinal().domain(['<= 5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12', '5.13', '?']))
        .xUnits(dc.units.ordinal)
        // .brushOn(false)
        .renderHorizontalGridLines(true);

    // attach event listener to each chart to show/hide filter elsewhere in the DOM
    dc.chartRegistry.list().forEach(function(chart) {
        chart.on('filtered', function() {
            if (chart.hasFilter()) {
                $(chart.anchor()).closest('.chart-wrapper').find('.reset').removeClass('hidden');
            } else {
                $(chart.anchor()).closest('.chart-wrapper').find('.reset').addClass('hidden');
            }

            data.features.forEach(function(d) {
                d.properties.highlighted = false;
            });
            filteredObjs.top(Infinity).forEach(function(d) {
                d.properties.highlighted = true;
            });
            geo.map.getSource('climbs').setData(data);

        });
    });

    dc.renderAll();
});
