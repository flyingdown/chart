<template>
  <div id="app">
    <img src="./assets/logo.png">
    <vue-highcharts :options="options" ref="splineCharts"></vue-highcharts>
    <!-- <button @click="load">load</button> -->
  </div>
</template>

<script>
import Highcharts from 'Highcharts'
import VueHighcharts from 'vue2-highcharts'
import {getTransform} from './api/transform'

export default {
    name: 'App',
    components: {
        VueHighcharts
    },
    data () {
        return{
            options: {
                chart: {
                    type: 'spline',
                    marginRight: 10,
                },
                title: {
                    text: '动态实时数据'
                },
                xAxis: {
                    type: 'datetime',
                    tickPixelInterval: 150,
                    labels: {
                        formatter: function () {
                            return Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.value)
                        }
                    }
                },
                yAxis: {
                    title: {
                        text: null
                    }
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + this.series.name + '</b><br/>' +
                            Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                            Highcharts.numberFormat(this.y, 2);
                    }
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        marker: {
                            enabled: true
                        }
                    }
                },
                series: []
            }
        }
    },
    methods: {
        addLastPoint(chart, index) {
            var series = chart.series[0],
                interval = 1000 * 60
            getTransform({'id': index}).then((value) => {
                let stringTime = value['data']['datetime'],
                    timeStamp = Date.parse(new Date(stringTime))
                console.log(stringTime + ':' + timeStamp)
                let x = timeStamp,
                    y = value['data']['number_7ha'],
                    flag = false;
                if (series.points.length >= 20) {
                    // console.log(series.points.length)
                    flag = true
                }
                series.addPoint([x, y], true, flag);
                this.activeLastPointToolip(chart);
                index++
                console.log(chart)
                setTimeout(this.addLastPoint, interval, chart, index)
            }).catch((err) => {
                console.log(err)
                setTimeout(this.addLastPoint, interval, chart, index)
            })
        },
        activeLastPointToolip(chart) {
            let points = chart.series[0].points;
            chart.tooltip.refresh(points[points.length -1]);
        },
        load () {
            let splineCharts = this.$refs.splineCharts,
                chart = splineCharts.getChart(),
                index
            splineCharts.delegateMethod('showLoading', 'Loading...');
            getTransform({'ordering':'-id'}).then((value) => {
                let asyncData = [],
                    results = value['data']['results'],
                index = results[0]['id']
                for (let i in results) {
                    let stringTime = results[i]['datetime'],
                        timeStamp = Date.parse(new Date(stringTime)),
                        x = timeStamp,
                        y = results[i]['number_7ha']
                    asyncData.push([x, y])
                }
                let preData = {
                    name: '变压器A',
                    data: asyncData.reverse()
                }
                splineCharts.addSeries(preData);
                splineCharts.hideLoading();
                this.activeLastPointToolip(chart)
                this.addLastPoint(chart, index)
            }).catch((err) => {
                console.log(err)
            })
        }
    },
    mounted () {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        })
        this.load()
    }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
