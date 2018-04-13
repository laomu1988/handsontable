require('./style.less')
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

// 需要选择数据时触发
hot.on('select-object', function(row, col, data) {
    console.log('select:', row, col, data);
    setTimeout(() => {
        let value = data.value
        hot.setDataAtCell(row, col, {
            name: 'selected:' + (value + 1),
            value: (value + 1)
        })
    }, 1000)
});

window.hot = hot