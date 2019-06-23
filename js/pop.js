 require([
        "esri/widgets/Sketch/SketchViewModel",
        "esri/geometry/Polyline",
        "esri/geometry/Point",
        "esri/Graphic",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/layers/GraphicsLayer",
        "esri/geometry/geometryEngine",
        "esri/widgets/Expand",
        "esri/widgets/Legend",
        "esri/widgets/Search",
        "esri/widgets/Home",
        "esri/core/watchUtils"
      ], function(SketchViewModel,Polyline,Point,Graphic,Map,MapView, FeatureLayer,GraphicsLayer, geometryEngine, Expand,Legend,Search,Home,watchUtils) {
        let sketchViewModel, featureLayerView, pausableWatchHandle, chartExpand,chartexpend_ehcart;

        let centerGraphic,
          edgeGraphic,
          polylineGraphic,
          bufferGraphic,
          centerGeometryAtStart,
          labelGraphic;

        const unit = "kilometers";
        const graphicsLayer = new GraphicsLayer();
        const graphicsLayer2 = new GraphicsLayer();
        const listNode = document.getElementById("nyc_graphics");
        const popupTemplate = {
          title: "{NAME}2012—2017年常住人口数",
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "pop_2012",
                  label: "2012年常住人口（千人次）",
                },
                {
                  fieldName: "pop_2013",
                  label: "2013年常住人口（千人次）",
                },
                {
                  fieldName: "pop_2014",
                  label: "2014年常住人口（千人次）",

                },
                {
                  fieldName: "pop_2015",
                  label: "2015年常住人口（千人次）",
                }, {
                  fieldName: "pop_2016",
                  label: "2016年常住人口（千人次）",
                }, {
                  fieldName: "pop_2017",
                  label: "2017年常住人口（千人次）",
                }
              ]
            }
          ]
        };
        var wuhan = new FeatureLayer({
        	portalItem:{
        		id:"248aed894a504e30ac5fea4771d82c4a"
        	},
        	outFields:["*"],
        	popupTemplate: popupTemplate
        });
        var map = new Map({
          basemap: "gray",
          layers:[wuhan, graphicsLayer2, graphicsLayer]
        });
        var view = new MapView({
          container: "viewDiv",
          map: map,
          zoom: 9, 
          center: [114.28, 30.58]
        });
        let graphics;
        //当加载完之后去图层每个的名字，然后写入右侧的列表
        view.whenLayerView(wuhan).then(function(layerView) {
          layerView.watch("updating", function(value) {
            if (!value) {
              layerView
                .queryFeatures({
                  geometry: view.extent,
                  returnGeometry: true
                })
                .then(function(results) {
                  graphics = results.features;
                  const fragment = document.createDocumentFragment();
                  graphics.forEach(function(result, index) {
                    const attributes = result.attributes;
                    const name = attributes.NAME;
                    const li = document.createElement("li");
                    li.classList.add("panel-result");
                    li.tabIndex = 0;
                    li.setAttribute("data-result-id", index);
                    li.textContent = name;
                    fragment.appendChild(li);
                  });
                  listNode.innerHTML = "";
                  listNode.appendChild(fragment);
                })
                .catch(function(error) {
                  console.error("query failed: ", error);
                });
            }
          });
        });
        // l哎呀，就是监听事件啦，你点哪个他移到哪咯
        listNode.addEventListener("click", onListClickHandler);

        function onListClickHandler(event) {
          const target = event.target;
          const resultId = target.getAttribute("data-result-id");
          const result =
            resultId && graphics && graphics[parseInt(resultId, 10)];
          if (result) {
            view.goTo(result.geometry.extent.expand(2)).then(function() {
              view.popup.open({
                features: [result],
                location: result.geometry.centroid
              });
            });
            var a=[];
            a[0]=(result.attributes.pop_2012/10).toFixed(2);
            a[1]=(result.attributes.pop_2013/10).toFixed(2);
            a[2]=(result.attributes.pop_2014/10).toFixed(2);
            a[3]=(result.attributes.pop_2015/10).toFixed(2);
            a[4]=(result.attributes.pop_2016/10).toFixed(2);
            a[5]=(result.attributes.pop_2017/10).toFixed(2);
            console.log(a);
            getechart(result.attributes.NAME,a);
          }
        }
        function getechart(name,a){
        	chartexpend_ehcart.expanded = true;
        	var myChart = echarts.init(document.getElementById('chartPanel1'));
			option = {
			title : {
			    text: name+'2012—2017年常住人口变化',
			},
			tooltip : {
			    trigger: 'axis'
			},
			legend: {
			    data:['人口变化']
			},
			toolbox: {
			    show : true,
			    feature : {
			        mark : {show: true},
			        dataView : {show: true, readOnly: false},
			        magicType : {show: true, type: ['line', 'bar']},
			        restore : {show: true},
			        saveAsImage : {show: true}
			    }
			},
			calculable : true,
			xAxis : [
			    {
			        type : 'category',
			        boundaryGap : false,
			        data : ['2012','2013','2014','2015','2016','2017']
			    }
			],
			yAxis : [
			    {
			        type : 'value',
			        name: '万人',			
			    }
			],
			series : [
			    {
			        name:'人口变化情况',
			        type:'line',
			        data:a,
			        markPoint : {
			            data : [
			                {type : 'max', name: '最大值'},
			                {type : 'min', name: '最小值'}
			            ]
			        },
			        markLine : {
			            data : [
			                {type : 'average', name: '平均值'}
			                ]
			            }
			        }
			    ]
			};
                    
			myChart.setOption(option);
        }
        const statDefinitions = ["pop_2012", "pop_2013","pop_2014","pop_2015","pop_2016","pop_2017"].map(function(
          fieldName
        ) {
          return {
            onStatisticField: fieldName,
            outStatisticFieldName: fieldName + "_TOTAL",
            statisticType: "sum"
          };
        });
        setUpAppUI();
        setUpSketch();
        function setUpAppUI() {
          view.whenLayerView(wuhan).then(function(layerView) {
            featureLayerView = layerView;
            pausableWatchHandle = watchUtils.pausable(
              layerView,
              "updating",
              function(val) {
                if (!val) {
                  drawBufferPolygon();
                }
              }
            );
          });
          view.when(function() {
            chartExpand = new Expand({
              expandIconClass: "esri-icon-chart",
              expandTooltip: "区域人口统计",
              expanded: false,
              view: view,
              content: document.getElementById("chartPanel")
            });
            chartexpend_ehcart = new Expand({
              expandIconClass: "esri-icon-chart",
              expandTooltip: "分区人口统计",
              expanded: false,
              view: view,
              content: document.getElementById("chartPanel1")
            });
            const legend = new Legend({
              view: view,
              layerInfos: [
                {
                  layer: wuhan,
                  title: "武汉各区常住人口数"
                }
              ]
            });
		    const legendExpand = new Expand({
		        expandTooltip: "图列",
		        expanded: false,
		        view: view,
		        content: legend
		    });
		    var homeBtn = new Home({
          	    view: view
           });
            view.ui.add(homeBtn,"bottom-right");
            view.ui.add(chartexpend_ehcart, "top-left");
            view.ui.add(chartExpand, "bottom-left");
            view.ui.add(legendExpand, "top-left");
          });
          view.watch("focused", function(newValue) {
            if (newValue) {
              view.popup.close();
            }
          });
        }
                  function setUpSketch() {
          sketchViewModel = new SketchViewModel({
            view: view,
            layer: graphicsLayer
          });
          sketchViewModel.on("update", onMove);
        }
        function onMove(event) {
          if (
            event.toolEventInfo &&
            event.toolEventInfo.mover.attributes.edge
          ) {
            const toolType = event.toolEventInfo.type;
            if (toolType === "move-start") {
              centerGeometryAtStart = centerGraphic.geometry;
            }
            else if (toolType === "move" || toolType === "move-stop") {
              centerGraphic.geometry = centerGeometryAtStart;
            }
          }
          const vertices = [
            [centerGraphic.geometry.x, centerGraphic.geometry.y],
            [edgeGraphic.geometry.x, edgeGraphic.geometry.y]
          ];
          calculateBuffer(vertices);
          if (event.state === "cancel" || event.state === "complete") {
            sketchViewModel.update([edgeGraphic, centerGraphic], {
              tool: "move"
            });
          }
        }
        function calculateBuffer(vertices) {
          polylineGraphic.geometry = new Polyline({
            paths: vertices,
            spatialReference: view.spatialReference
          });
          const length = geometryEngine.geodesicLength(
            polylineGraphic.geometry,
            unit
          );
          const buffer = geometryEngine.geodesicBuffer(
            centerGraphic.geometry,
            length,
            unit
          );
          bufferGraphic.geometry = buffer;
          queryLayerViewAgeStats(buffer).then(function(newData) {
            updateChart(newData);
          });
          labelGraphic.geometry = edgeGraphic.geometry;
          labelGraphic.symbol = {
            type: "text",
            color: "#00FFFF",
            text: length.toFixed(2) + " kilometers",
            xoffset: 25,
            yoffset: 10,
            font: {
              size: 14,
              family: "sans-serif"
            }
          };
        }
        function queryLayerViewAgeStats(buffer) {
          let pop = [];
          const query = featureLayerView.layer.createQuery();
          query.outStatistics = statDefinitions;
          query.geometry = buffer;
          return featureLayerView
            .queryFeatures(query)
            .then(function(results) {
              const attributes = results.features[0].attributes;
              for (var key in attributes) {
                if (key.includes("pop")) {
                  pop.push(Math.abs(attributes[key]*1000).toFixed(1));
                } 
              }
              return [pop];
            })
            .catch(function(error) {
              console.log(error);
            });
        }
        function drawBufferPolygon() {
          pausableWatchHandle.pause();
          const viewCenter = view.center.clone();
          const centerScreenPoint = view.toScreen(viewCenter);
          const centerPoint = view.toMap({
            x: centerScreenPoint.x + 50,
            y: centerScreenPoint.y - 100
          });
          const edgePoint = view.toMap({
            x: centerScreenPoint.x + 100,
            y: centerScreenPoint.y - 100
          });
          const vertices = [
            [centerPoint.x, centerPoint.y],
            [edgePoint.x, edgePoint.y]
          ];
          if (!centerGraphic) {
            const polyline = new Polyline({
              paths: vertices,
              spatialReference: view.spatialReference
            });
            const length = geometryEngine.geodesicLength(polyline, unit);
            const buffer = geometryEngine.geodesicBuffer(
              centerPoint,
              length,
              unit
            );
            const pointSymbol = {
              type: "simple-marker",
              style: "circle",
              size: 10,
              color: [0, 255, 255, 0.5]
            };
            centerGraphic = new Graphic({
              geometry: centerPoint,
              symbol: pointSymbol,
              attributes: {
                center: "center"
              }
            });

            edgeGraphic = new Graphic({
              geometry: edgePoint,
              symbol: pointSymbol,
              attributes: {
                edge: "edge"
              }
            });

            polylineGraphic = new Graphic({
              geometry: polyline,
              symbol: {
                type: "simple-line",
                color: [254, 254, 254, 1],
                width: 2.5
              }
            });

            bufferGraphic = new Graphic({
              geometry: buffer,
              symbol: {
                type: "simple-fill",
                color: [150, 150, 150, 0.2],
                outline: {
                  color: "#00FF00",
                  width: 2
                }
              }
            });
            labelGraphic = labelLength(edgePoint, length);
            graphicsLayer.addMany([centerGraphic, edgeGraphic]);

            setTimeout(function() {
              sketchViewModel.update([edgeGraphic, centerGraphic], {
                tool: "move"
              });
            }, 1000);
            graphicsLayer2.addMany([
              bufferGraphic,
              polylineGraphic,
              labelGraphic
            ]);
          }
          else {
            centerGraphic.geometry = centerPoint;
            edgeGraphic.geometry = edgePoint;
          }
          calculateBuffer(vertices);
        }
        let chart;
        function updateChart(newData) {
          chartExpand.expanded = true;
          const pop = newData[0];
          const popchange=pop[5]-pop[0];
          if (!chart) {
            const canvasElement = document.getElementById("chart");
            chart = new Chart(canvasElement.getContext("2d"), {
              type: "horizontalBar",
              data: {
                labels: [
                  "2012",
                  "2013",
                  "2014",
                  "2015",
                  "2016",
                  "2017"
                ],
                datasets: [
                  {
                    label: "常住人口",
                    backgroundColor: "#33FFFF",
                    borderColor: "#7F00FF",
                    borderWidth: 0.25,
                    data: pop
                  }
                ]
              },
              options: {
                responsive: true,
                legend: {
                  position: "bottom"
                },
                title: {
                  display: true,
                  text: "2012年-2017年常住人口变化："+popchange+"人"
                },
                scales: {
                  yAxes: [
                    {
                    	barThickness: 10,
                        scaleLabel: {
                        labelString: "人口数"
                      }
                    }
                  ],
                  xAxes: [
                    {	
                        scaleLabel: {
                        labelString: "Population"
                      }
                    }
                  ]
                }
              }
            });
          } else {
            chart.data.datasets[0].data = pop;
            chart.options.title.text="2012年-2017年常住人口变化："+popchange+"人";
            chart.update();
          }
        }
        function labelLength(geom, length) {
          return new Graphic({
            geometry: geom,
            symbol: {
              type: "text",
              color: "#FFEB00",
              text: length.toFixed(2) + " kilometers",
              xoffset: 25,
              yoffset: 10,
              font: {
                size: 14,
                family: "sans-serif"
              }
            }
          });
        }
    	var applicationDiv = document.getElementById("applicationDiv");
	    var slider = document.getElementById("slider");
	    var sliderValue = document.getElementById("sliderValue");
	    var playButton = document.getElementById("playButton");
	    var titleDiv = document.getElementById("titleDiv");
	    var animation = null;
	      //拖动滑块
      	function inputHandler() {
	        stopAnimation();
	        setYear(parseInt(slider.value));
      	}
      	slider.addEventListener("input", inputHandler);
	    slider.addEventListener("change", inputHandler);
	    playButton.addEventListener("click", function() {
	        if (playButton.classList.contains("toggled")) {
	            stopAnimation();
	        } else {
	            startAnimation();
	        }
        });
        view.whenLayerView(wuhan).then(setupHoverTooltip);
        const colorArray = [[124.3,1458],[126.8,1477.4],[129,1498.9],[131,1250.6],[131.6,1256.4],[135.5,1258.6]];
		function setYear(value) {
		    sliderValue.innerHTML = Math.round(value);
		    slider.value = Math.round(value);
		    wuhan.renderer = createRenderer(slider.value,colorArray[slider.value-2012]);
		}
		  //设置起始年份
		setYear(2012);
		  //设置渲染器
		    //设置渲染器
        function createRenderer(year,array) {
        	var a=array[1]/10;
        	var b=array[0]/10;
		    return {
		    	type: "simple", // autocasts as new SimpleRenderer()
			        symbol: {
		 				type: "simple-fill", // autocasts as new SimpleFillSymbol()
		    		outline: { // autocasts as new SimpleLineSymbol()
		     	 		width: 0
		    		}
		        },
			        label: year+"人口",
			        visualVariables: [{
			        type: "color",
			        field:"pop_"+year,
		            legendOptions: {
		            title:year + "人口"
		        },
			          stops: [
			          {
			            value: array[1],
			            color: "#5E005E",
			            label: a.toFixed(2)+"万人"
			          },
			          {
			            value: array[0],
			            color: "#F6CED8",
			            label: b.toFixed(2)+"万人"
			          }]
			        }]
		    };
        }
	    function setupHoverTooltip(layerview) {
		    var promise;
		    var highlight;
		
		    var tooltip = createTooltip();
		
		    view.on("pointer-down", function(event) {
		      if (promise) {
		        promise.cancel();
		      }
		
		      promise = view.hitTest(event.x, event.y)
		        .then(function(hit) {
		          promise = null;
		
		          // 高亮显示，暂时有问题
		          if (highlight) {
		            highlight.remove();
		            highlight = null;
		          }
		          var results = hit.results.filter(function(result) {
		            return result.graphic.layer === wuhan;
		          });
		
		          if (results.length) {
		            var graphic = results[0].graphic;
		            var screenPoint = hit.screenPoint;
		
		            highlight = layerview.highlight(graphic);
		            tooltip.show(screenPoint, "人口 " + graphic.getAttribute(
		              year));
		          } else {
		            tooltip.hide();
		          }
		        });
		    });
	    }
	        function startAnimation() {
        stopAnimation();
        animation = animate(parseFloat(slider.value));
        playButton.classList.add("toggled");
      }

      /**
       * Stops the animations
       */
      function stopAnimation() {
        if (!animation) {
          return;
        }

        animation.remove();
        animation = null;
        playButton.classList.remove("toggled");
      }

      /**
       * Animates the color visual variable continously
       */
      function animate(startValue) {
        var animating = true;
        var value = startValue;

        var frame = function(timestamp) {
          if (!animating) {
            return;
          }

          value += 0.5;
          if (value > 2016) {
            value = 2012;
          }

          setYear(value);

          // Update at 30fps
          setTimeout(function() {
            requestAnimationFrame(frame);
          }, 1000);
        };

        frame();

        return {
          remove: function() {
            animating = false;
          }
        };
      }
      function createTooltip() {
        var tooltip = document.createElement("div");
        var style = tooltip.style;

        tooltip.setAttribute("role", "tooltip");
        tooltip.classList.add("tooltip");

        var textElement = document.createElement("div");
        textElement.classList.add("esri-widget");
        tooltip.appendChild(textElement);

        view.container.appendChild(tooltip);

        var x = 0;
        var y = 0;
        var targetX = 0;
        var targetY = 0;
        var visible = false;

        // 逐步移动工具提示
        function move() {
          x += (targetX - x) * 0.1;
          y += (targetY - y) * 0.1;

          if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
            x = targetX;
            y = targetY;
          } else {
            requestAnimationFrame(move);
          }

          style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(
            y) + "px, 0)";
        }

        return {
          show: function(point, text) {
            if (!visible) {
              x = point.x;
              y = point.y;
            }

            targetX = point.x;
            targetY = point.y;
            style.opacity = 1;
            visible = true;
            textElement.innerHTML = text;

            move();
          },

          hide: function() {
            style.opacity = 0;
            visible = false;
          }
        };
      }
      view.ui.add(titleDiv, "top-right");
      view.on("pointer-move", eventHandler);
      view.on("pointer-leave", eventHandler);
	  function eventHandler(event) {
  
        view.hitTest(event)
          .then(getGraphics);
      }
      //获取值
      function getGraphics(response) {
 				
        if (response.results.length) {
          var graphic = response.results.filter(function(result) {
            return result.graphic.layer === wuhan;
          })[0].graphic;
          var year=document.getElementById("slider").value;
          var attributes = graphic.attributes;
          var pop = graphic.getAttribute("pop_"+year)/10;
          var name =attributes.NAME;
          document.getElementById("titleDiv").style.visibility = "visible";
          document.getElementById("name").innerHTML =year+"年"+name+"常住人口数"+pop.toFixed(2)+"万人";
        }
      }
      });