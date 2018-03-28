/**
 * @file 表格编辑文件
 */

import 'handsontable/dist/handsontable.full.min.css'
var Handsontable = require('handsontable/dist/handsontable.full.min.js')
var FormulaParser = require('hot-formula-parser').Parser
var parser = new FormulaParser()
var result = parser.parse('SUM(1, 6, 7)') // It returns `Object {error: null, result: 14}`
console.log('result:', result)


var data = [
    ['', 'Ford', 'Tesla', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, 13],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, 15, 12, 13]
]

var container = document.getElementById('table')
var hot = new Handsontable(container, {
    data: data,
    rowHeaders: true,
    colHeaders: true
})