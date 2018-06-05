<template>
  <div id="app">
    <img src="./assets/logo.png">
    <div>
        <selection :selections='selectionList' @onChange="onParamChange('label', $event)"></selection>
    </div>
    <div>
        <check-box :selections='checkList' @onChange="onParamChange('value', $event)"></check-box>
    </div>
    <vue-highcharts :options="options" ref="splineCharts" :highcharts="Highcharts"></vue-highcharts>
    <button @click="chartPrint">打印图表</button>
  </div>
</template>

<script>
import VueHighcharts from 'vue2-highcharts'
import {getTransform} from './api/transform'
import checkBox from './components/checkBox'
import selection from './components/selection'
import exporting from 'highcharts/modules/exporting'
import Highcharts from 'highcharts'

Exporting(Highcharts)

export default {
    name: 'App',
    components: {
        VueHighcharts,
        checkBox,
        selection
    },
    data () {
        return{
            Highcharts,
            handle: null,
            colors: {
                'a': '#7cb5ec',
                'b': '#434348',
                'c': '#90ed7d'
            },
            transformInfo: {
                label: '7',
                value: ['a']
            },
            checkList: [
                {
                    label: 'A相电流',
                    value: 'a'
                },
                {
                    label: 'B相电流',
                    value: 'b'
                },
                {
                    label: 'C相电流',
                    value: 'c'
                }
            ],
            selectionList: [
                {
                    label: '7号变压器',
                    value: '7'
                },
                {
                    label: '8号变压器',
                    value: '8'
                }
            ],
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
                    enabled: true
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
        chartPrint () {
            this.$refs.splineCharts.getChart().print()
        },
        onParamChange(attr, value) {
            switch (attr) {
                case 'label':
                    this.transformInfo.label = value.value
                    break
                case 'value':
                    console.log(value)
                    this.transformInfo.value = []
                    for (let i in value) {
                        this.transformInfo.value.push(value[i].value)
                    }
                    break
            }
            if (this.$refs.splineCharts != null){
                this.$refs.splineCharts.removeSeries()
            }
            // console.log(this.transformInfo)
            this.load()
        },
        addLastPoint(chart, index) {
            var series = chart.series,
                interval = 1000 * 60
            getTransform({'id': index}).then((value) => {
                // console.log(value)
                let label = this.transformInfo.label,
                    x = value['data']['timestamp'],
                    y = [],
                    flag = false

                y['a'] = value['data']['number_' + label + 'ha']
                y['b'] = value['data']['number_' + label + 'hb']
                y['c'] = value['data']['number_' + label + 'hc']

                for (let i in this.transformInfo.value) {
                    let value = this.transformInfo.value
                    // console.log(i + ':' + value[i])
                    if (series[i].points.length >= 20) {
                        // console.log(series.points.length)
                        flag = true
                    }
                    series[i].addPoint([x, y[value[i]]], true, flag)
                }
                console.log(series)
                this.activeLastPointToolip(chart);
                index++
                // console.log(chart)
                this.handle = setTimeout(this.addLastPoint, interval, chart, index)
            }).catch((err) => {
                console.log(err)
                this.handle = setTimeout(this.addLastPoint, interval, chart, index)
            })
        },
        activeLastPointToolip(chart) {
            let points = chart.series[0].points;
            chart.tooltip.refresh(points[points.length -1]);
        },
        load () {
            if (this.handle) {
                console.log(this.handle)
                clearTimeout(this.handle)
            }
            let splineCharts = this.$refs.splineCharts,
                chart = splineCharts.getChart(),
                index
            splineCharts.delegateMethod('showLoading', 'Loading...');
            getTransform({'ordering':'-id'}).then((value) => {
                let aData = [],
                    bData = [],
                    cData = [],
                    results = value['data']['results'],
                index = results[0]['id']
                for (let i in results) {
                    let label = this.transformInfo.label,
                        x = results[i]['timestamp'],
                        a = results[i]['number_' + label + 'ha'],
                        b = results[i]['number_' + label + 'hb'],
                        c = results[i]['number_' + label + 'hc']
                    aData.push([x, a])
                    bData.push([x, b])
                    cData.push([x, c])
                }
                for (let i in this.transformInfo.value) {
                    let preData = null
                    switch (this.transformInfo.value[i]) {
                        case 'a':
                            preData = {
                                name: this.transformInfo.label + '号变压器' + '<br>a相电流',
                                data: aData.reverse(),
                                color: this.colors.a
                            }
                            splineCharts.addSeries(preData)
                            break;
                        case 'b':
                            preData = {
                                name: this.transformInfo.label + '号变压器' + '<br>b相电流',
                                data: bData.reverse(),
                                color: this.colors.b
                            }
                            splineCharts.addSeries(preData)
                            break;
                        case 'c':
                            preData = {
                                name: this.transformInfo.label + '号变压器' + '<br>c相电流',
                                data: cData.reverse(),
                                color: this.colors.c
                            }
                            splineCharts.addSeries(preData)
                            break;
                    }
                }
                splineCharts.hideLoading();
                // console.log(chart.series)
                chart.redraw()
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
