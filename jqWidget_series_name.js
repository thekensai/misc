//on a jqwidget donut chart, find the center of the rings and add series name to each ring

        var e = this.parent_view.getChartElement();

        if (!e || e.length < 1) {
            console.log("iportChart.pieChartView.postRender: chart element does not exist");
            return;
        }
        console.log('series_names',this.series_names);
        e.on("refreshEnd", function () {
            console.log("refreshEnd");

            var paths = $('#svgChart>g>g:last-of-type>path');
            
            var pathGroup = {};
            var regex = /^M ([\d\.]+),([\d\.]+) a(\d+),/;
            
            for (var i = 0; i < paths.length; i++) {
                var d = (paths[i].getAttribute('d'));

                var match = regex.exec(d);

                if (!match) {
                    continue;
                }

                var radius = match[3];
                if (!pathGroup[radius]) {
                    pathGroup[radius] = { points: [] };
                }

                var group = pathGroup[radius];

                var x = parseFloat(match[1], 10), y = parseFloat(match[2], 10);

                group.points.forEach(function (point, idx) {
                    var dx = point.x - x, dy = point.y - y;
                    var length = Math.sqrt(dx * dx + dy * dy);

                    if (!group.chord1 || length > group.chord1.length) {

                        if (group.chord2) {
                            group.chord2.length = group.chord1.length;
                            group.chord2.idx1 = group.chord1.idx1;
                            group.chord2.idx2 = group.chord1.idx2;
                        }

                        group.chord1 = { length: length, idx1: group.points.length, idx2: idx };
                    }
                    else if (!group.chord2 || length > group.chord2.length) {
                        group.chord2 = { length: length, idx1: group.points.length, idx2: idx };
                    }
                });

                group.points.push({ x: x, y: y });
            }

            var circum = {};

            for (var rad in pathGroup) {
                var path = pathGroup[rad];

                if (!path.chord1 || !path.chord2) continue;

                if (!circum.chord1 || path.chord1.length * path.chord2.length > circum.chord1.length * circum.chord2.length)
                    circum = {
                        radius: rad,
                        chord1: {
                            x1: path.points[path.chord1.idx1].x,
                            y1: path.points[path.chord1.idx1].y,
                            x2: path.points[path.chord1.idx2].x,
                            y2: path.points[path.chord1.idx2].y,
                            length: path.chord1.length
                        },
                        chord2: {
                            x1: path.points[path.chord2.idx1].x,
                            y1: path.points[path.chord2.idx1].y,
                            x2: path.points[path.chord2.idx2].x,
                            y2: path.points[path.chord2.idx2].y,
                            length: path.chord2.length
                        }
                    }
            }

            if (circum) {
                var center = { x: 0, y: 0 };

                var s1_x, s1_y, s2_x, s2_y;
                s1_x = circum.chord1.x2 - circum.chord1.x1;
                s1_y = circum.chord1.y2 - circum.chord1.y1;

                s2_x = circum.chord2.x2 - circum.chord2.x1;
                s2_y = circum.chord2.y2 - circum.chord2.y1;

                var s = (-s1_y * (circum.chord1.x1 - circum.chord2.x1) + s1_x * (circum.chord1.y1 - circum.chord2.y1)) / (-s2_x * s1_y + s1_x * s2_y);
                var t = (s2_x * (circum.chord1.y1 - circum.chord2.y1) - s2_y * (circum.chord1.x1 - circum.chord2.x1)) / (-s2_x * s1_y + s1_x * s2_y);

                if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                    center.x = circum.chord1.x1 + (t * s1_x);
                    center.y = circum.chord1.y1 + (t * s1_y);
                }
                else {
                    //parallel chords
                    //todo
                }
            }
            else {
                //todo
            }

            var idx = 0;
            for (var rad in pathGroup) {
                xmlns = "http://www.w3.org/2000/svg";
                var C = document.createElementNS(xmlns, "text");
                C.setAttributeNS(null, "x", center.x - 20);
                C.setAttributeNS(null, "y", center.y - rad);
                C.setAttributeNS(null, "font-size", 20);
                C.innerHTML = this.series_names[idx++];
                //C.setAttributeNS(null, "fill", 'red');
                document.getElementById("svgChart").appendChild(C);
            }

            xmlns = "http://www.w3.org/2000/svg";
            var C = document.createElementNS(xmlns, "circle");
            C.setAttributeNS(null, "cx", center.x);
            C.setAttributeNS(null, "cy", center.y);
            C.setAttributeNS(null, "r", 4);
            C.setAttributeNS(null, "fill", 'red');
            document.getElementById("svgChart").appendChild(C);

            /*var C = document.createElementNS(xmlns, "line");
            C.setAttributeNS(null, "x1", circum.chord2.x1);
            C.setAttributeNS(null, "x2", circum.chord2.x2);
            C.setAttributeNS(null, "y1", circum.chord2.y1);
            C.setAttributeNS(null, "y2", circum.chord2.y2);
            C.setAttributeNS(null, "style", 'stroke:rgb(255,0,0);stroke-width:2');
            document.getElementById("svgChart").appendChild(C);*/
            //console.log(center);

        }.bind(this));
