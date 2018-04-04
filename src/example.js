const Tabel = require('./table.js')
var data = [
    ['', 'Ford', 'Tesla', 'Toyota', 'Honda'],
    ['2017', 10, 11, 12, {name: '数据{value: 123}', value: 123}],
    ['2018', 20, 11, 14, 13],
    ['2019', 30, '=B1+B2', '=A2+B2', '=E2.value+1']
]

var container = document.getElementById('table')
var hot = new Tabel({
    dom: container,
    data: data
})
window.hot = hot