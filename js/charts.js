var countNumberDisplay = dc.numberDisplay('#count-number-display');
var typePieChart = dc.pieChart("#type-pie-chart");
var classPieChart = dc.pieChart("#class-pie-chart");
var gradeBarChart = dc.barChart('#grade-bar-chart');
var pitchesRowChart = dc.rowChart('#pitches-row-chart');

// set initial height for app containers
$("#app-wrapper").css('height', window.innerHeight + "px");
$("#app-maparea").css('height', window.innerHeight + "px");

$.getJSON('data/colm-climbs-v3.geojson', function(data) {

    geo.initMap();
    geo.addLayer(data);
    geo.map.on('load', geo.addEventListeners);

    var ndx = crossfilter(data.features);

    var totalClimbs = ndx.groupAll();

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

    countNumberDisplay
        .formatNumber(d3.format(',.0f'))
        .valueAccessor(function(d) {
            return d;
        }).html({
            one: "<span class='climb-count'>%number</span><span class='climb-count-words'> climb matches the current filters</span>",
            some: "<span class='climb-count'>%number</span><span class='climb-count-words'> climbs match the current filters</span>",
            none: "<span class='climb-count'>%number</span><span class='climb-count-words'> climbs match the current filters</span>"
        })
        .group(totalClimbs);

    typePieChart
        .width(managePieSize(typePieChart)).height(managePieSize(typePieChart))
        .dimension(typeDim)
        .group(total_by_type);

    classPieChart
        .width(managePieSize(classPieChart)).height(managePieSize(classPieChart))
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
        .renderHorizontalGridLines(true)
        .yAxis().tickFormat(d3.format('d'));

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
        .elasticX(true)
        .xAxis().tickFormat(d3.format('d'));

    // attach event listener to each chart to show/hide filter elsewhere in the DOM
    dc.chartRegistry.list().forEach(function(chart) {
        chart.on('filtered', function() {
            if (chart.hasFilter()) {
                $(chart.anchor()).closest('.chart-wrapper').find('.reset').removeClass('hidden');
            } else {
                $(chart.anchor()).closest('.chart-wrapper').find('.reset').addClass('hidden');
            }

            // update the data displayed by all layers in the map to only include the data we've filtered to
            var selectedFeaturesGeojson = {
                "type": "FeatureCollection",
                "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
                "features": filteredObjs.top(Infinity)
            };
            geo.map.getSource('climbs').setData(selectedFeaturesGeojson);

            // ease to the extent of the new features
            var bbox = geo.addCosmeticPadding(turf.bbox(selectedFeaturesGeojson));
            geo.map.fitBounds(bbox);
        });
    });

    dc.renderAll();
});

$(document).ready(function() {
    // turn on the popover and tooltip when ready
    $('a[data-toggle="tooltip"]').tooltip();
    if ($('.page-switch-icon').css('display') !== 'none') {
        // only show this one if the icons are also showing
        $('.page-switch-icon[data-toggle="tooltip"]').tooltip('show');

        // remove introductory tooltip after first click anywhere
        $(document).one("click", function() {
            $('.page-switch-icon[data-toggle="tooltip"]').tooltip('destroy');
        });
    }
});

$(window).on('resize', function(event) {
    // resize app height in case of window reshape
    $("#app-wrapper").css('height', window.innerHeight + "px");
    $("#app-maparea").css('height', window.innerHeight + "px");

    // make charts responsive to changes in width
    dc.chartRegistry.list().forEach(function(chart) {
        chart.width($(chart.anchor()).parent().width() - 7).transitionDuration(0);
        dc.renderAll();
        chart.transitionDuration(750); // return the transition speed to default
    });
});

// controls for the buttons to switch between map and charts
$('.page-switch-icon>i.fa').click(function() {
    $('html, body').animate({
        scrollTop: $($(this).attr('data-scroll-to')).offset().top
    }, 500);
});

function managePieSize(pieChart) {
    var anchorSize = $(pieChart.anchor()).parent().width();

    if (anchorSize <= 187) {
        return anchorSize - 7;
    } else {
        return 180;
    }
}
