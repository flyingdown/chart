<template>
  <div id="app">
    <img src="./assets/logo.png">
    <el-row>
        <el-col :span="12">
            <div>
                <div>
                    <selection :selections='selectionList' @onChange="onParamChange('label', $event)"></selection>
                </div>
                <div>
                    <check-box :selections='checkList' @onChange="onParamChange('value', $event)"></check-box>
                </div>
            </div>
        </el-col>
        <el-col :span="12">
            <el-row>
                <el-col :span="6">
                    <div class="my-witch">
                        <el-switch v-model="switchValue" active-color="#13ce66" inactive-color="#ff4949" @change="switchChange"></el-switch>
                    </div>
                </el-col>
                <el-col :span="18">
                    <div>
                        <el-date-picker ref="datetimePicker" :disabled="!switchValue" v-model="pickTime" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="yyyy-MM-dd HH:mm:ss" @change="datetimePicked"></el-date-picker>
                    </div>
                </el-col>
            </el-row>
            <div>
            </div>
        </el-col>
    </el-row>
    <vue-highcharts :options="options" ref="splineCharts" :highcharts="Highcharts"></vue-highcharts>
    <button @click="chartPrint">打印图表</button>
    <div>
        <el-table ref="singleTable" :data="tableData" height="250" stripe highlight-current-row @current-change="handleCurrentChange">
            <el-table-column fixed align="center" prop="id" label="id" width="60"></el-table-column>
            <el-table-column prop="datetime" align="center" label="日期时间" width="250">
                <template slot-scope="scope">
                    <i class="el-icon-time"></i>
                    <span style="margin-left: 10px">{{ scope.row.datetime }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="number_7ha" align="center" label="A相电流" width="120"></el-table-column>
            <el-table-column prop="number_7hb" align="center" label="B相电流" width="120"></el-table-column>
            <el-table-column prop="number_7hc" align="center" label="C相电流" width="120"></el-table-column>
            <el-table-column prop="number_7j" align="center" label="尖电量" width="120"></el-table-column>
            <el-table-column prop="number_7f" align="center" label="峰电量" width="120"></el-table-column>
            <el-table-column prop="number_7p" align="center" label="平电量" width="120"></el-table-column>
            <el-table-column prop="number_7z" align="center" label="总电量" width="120"></el-table-column>
            <el-table-column prop="number_7g" align="center" label="谷电量" width="120"></el-table-column>
        </el-table>
    </div>
  </div>
</template>

<script>
import VueHighcharts from 'vue2-highcharts'
import {getTransform} from './api/transform'
import checkBox from './components/checkBox'
import selection from './components/selection'
import exporting from 'highcharts/modules/exporting'
import Highcharts from 'highcharts'

Highcharts.setOptions({
    global: {
        useUTC: false
    }
})

exporting(Highcharts)

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
            tableData: [],
            switchValue: false,
            currentDateTimePicker: null,
            pickTime: '',
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
                    marginRight: 10
                },
                credits: {
                    href: 'http://flydowning.com',
                    text: 'flyingdown.com'
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
        datetimePicked (val) {
            console.log(val)
            this.currentDateTimePicker = val
            if (val === null) {
                this.$refs.datetimePicker.focus()
                this.$notify.error({
                    title: '错误',
                    message: '还没有选择时间范围'
                })
                return
            }
            let splineCharts = this.$refs.splineCharts,
                chart = splineCharts.getChart()
            splineCharts.delegateMethod('showLoading', 'Loading...')
            getTransform({
                'history': true,
                'min_date': val[0],
                'max_date': val[1]
            }).then((value) => {
                console.log(value)
                splineCharts.removeSeries()

                chart.update({
                    chart: {
                        zoomType: 'x'
                    },
                    plotOptions: {
                        series: {
                            marker: {
                                enabled: false
                            },
                            lineWidth: 1
                        }
                    }
                })
                console.log(chart)
                this.loadData(splineCharts, value)
                splineCharts.hideLoading();
                chart.redraw()
                this.activeLastPointToolip(chart)
            }).catch((err) => {
                console.log(err)
            })
        },
        switchChange (val) {
            if (val) {
                this.$notify.info({
                    title: '提示',
                    message: '关闭实时动态数据刷新'
                })
                clearTimeout(this.handle)
                return
            } else {
                this.load()
            }
        },
        setCurrent (row) {
            this.$refs.singleTable.setCurrentRow(row)
        },
        handleCurrentChange (val) {
            setTimeout(this.setCurrent, 1000)
        },
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
            // console.log(this.transformInfo)
            if (this.switchValue) {
                this.datetimePicked(this.currentDateTimePicker)
            } else {
                this.load()
            }
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

                // 更新table数据
                this.tableData.unshift(value.data)
                this.tableData.pop()

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
                // console.log(series)
                this.activeLastPointToolip(chart)
                this.setCurrent(this.tableData[0])
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
        loadData (splineCharts, value) {
            if (value.data.count === 0) {
                this.$notify({
                    title: '警告',
                    message: '所选时段数据为空',
                    type: 'warning'
                })
                splineCharts.hideLoading()
                return -1
            }

            let aData = [],
                bData = [],
                cData = [],
                results = value['data']['results'],
                index = results[0]['id']
            this.tableData = results
            // console.log(this.tableData)
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
            return index
        },
        load () {
            if (this.handle) {
                console.log(this.handle)
                clearTimeout(this.handle)
            }
            let splineCharts = this.$refs.splineCharts,
                chart = splineCharts.getChart()

            chart.update({
                plotOptions: {
                    chart: {
                        zoomType: 'a'
                    },
                    series: {
                        marker: {
                            enabled: true
                        },
                        lineWidth: 2
                    }
                }
            })
            splineCharts.removeSeries()

            splineCharts.delegateMethod('showLoading', 'Loading...')
            getTransform({'ordering':'-id'}).then((value) => {
                let index = this.loadData(splineCharts, value)
                splineCharts.hideLoading();
                chart.redraw()
                this.activeLastPointToolip(chart)
                this.handle = setTimeout(this.addLastPoint, 1000 * 60, chart, index+1)
            }).catch((err) => {
                console.log(err)
            })
        }
    },
    mounted () {

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

.my-witch {
    padding-top: 10px;
}
</style>
