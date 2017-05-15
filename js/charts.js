$.getJSON('data/colm-climbs-v2.json', function(data) {

    data.forEach(function(d) {
        d.Height_Ft = Number(d.Height_Ft); // coerce to number
        d.Pitches = Number(d.Pitches);
        d.Anchors = Number(d.Anchors);
    });

    ndx = crossfilter(data);

    typeDim = ndx.dimension(function(d) {
        return d.Type;
    });

    // total_by_type = typeDim.group().reduceSum(function(d) {
    //     return 1;
    // });

    total_by_type = typeDim.group();

    gradeDim = ndx.dimension(function(d) {
        var diff = d.Difficulty.replace('5.', '');
        if (diff.indexOf('V') == -1) {
            var regex = /[0-9]+/g;
            var m = regex.exec(diff);
            if (m) {
                return m[0];
            } else {
                return 'unknown';
            }
        } else {
            return 'boulder';
        }
    });

    total_by_grade = gradeDim.group().reduceSum(function(d) {
        return 1;
    });

    var typePieChart = dc.pieChart("#type-pie-chart");
    typePieChart
        .width(150).height(150)
        .dimension(typeDim)
        .group(total_by_type);

    var gradeBarChart = dc.barChart('#grade-bar-chart');
    gradeBarChart
        .width(420)
        .height(180)
        .margins({ top: 10, right: 50, bottom: 30, left: 40 })
        .dimension(gradeDim)
        .group(total_by_grade)
        .elasticY(true)
        // (_optional_) whether bar should be center to its x value. Not needed for ordinal chart, `default=false`
        .centerBar(true)
        // (_optional_) set gap between bars manually in px, `default=2`
        .gap(1)
        // (_optional_) set filter brush rounding
        .round(dc.round.floor)
        .alwaysUseRounding(true)
        .x(d3.scale.linear().domain([0, 13]))
        // .brushOn(false)
        .renderHorizontalGridLines(true);


    dc.renderAll();
});
