require('./style.less')
const Tabel = require('./table.js')
var data = [
    ['说明', '内容', '内容'],
    ['数据', 10, 11],
    ['字符串', 'AAA', ''],
    ['对象', {name: '对象A', value: 123}, {name: '对象B', value: 133}],
    ['公式', '=B2+C2'],
    ['错误示例', '=B1+B2'],
    ['对象属性计算', '=B4.value'],
    ['别名计算示例', '=B4.值'],
    ['不存在的属性', '=B4.notExist'],
]

var container = document.getElementById('table')
var hot = new Tabel({
    dom: container,
    data: data,
    // 属性别名
    propAlias: {
        'value': '值'
    }
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