require('./style.less')
const Tabel = require('./table.js')
var data = [
    ['说明', '内容', null],
    ['数据', 10, 11],
    ['字符串', 'AAA', {name: 1}],
    ['对象', {name: '对象A', value: 123, hide: false}, {name: '对象B', value: 133}],
    ['公式', '=B2+C2'],
    ['错误示例', '=B1+B2'],
    ['对象属性计算', '=B4.value + 1'],
    ['别名计算示例', '=B4.值 + 1'],
    ['不存在的属性', '=B4.notExist'],
    ['公式套公式', '=B5 + 10', {$prop: 'name'}],
    ['公式SUM', '=SUM(B2:C2)'],
    ['时间转换', '2012-12-12', '=DateToNumber(B12)'],
    ['时间差', '2012-12-13', '=DateToNumber(B13) - DateToNumber(B12)'],
    ['数字转时间', '2012-12-13', '=NumberToDate(C12)'],
    ['对象编辑', {prop: 'name', value: 1, copyable: false}],
    ['禁止编辑', {prop: 'name', value: '12', readOnly: true}],
    ['禁止复制', {prop: 'name', value: '12', copyable: false}],
    ['当前时间', {prop: '', value: '12'}],
]

var container = document.getElementById('table')
var options = {
    dom: container,
    data: data,
    disabled: false,
    // 属性别名
    propAlias: {
        'value': '值'
    },
    // 传入的修改数据内容
    props: {
        name: '测试props'
    },
    mergeCells: [
        {row: 0, col: 1, rowspan: 1, colspan: 2}
    ],
    cell: [
        {row: 0, col: 0, className: 'htRight'}
    ],
};
var hot = new Tabel(options)

// 需要选择数据时触发
hot.on('dblclick-object', function(row, col, data) {
    console.log('select:', row, col, data);
    // setTimeout(() => {
    //     if (typeof data === 'object') {
    //         data.value = (parseInt(data.value) || 0) + 1
    //         hot.setDataAtCell(row, col, data)
    //     }
    // }, 1000)
});

hot.on('update', function(data) {
    console.log('update:', hot.getDataWithFormat());
})

hot.on('update-attr', function(data) {
    console.log('update:', data);
})

hot.on('error', function(messgae) {
    alert(messgae);
});

addListener('#addLine', () => {
    let data = hot.getData();
    let addData = data[0].map(v => v);
    hot.insertRow(0, addData);
})


addListener('#deleteLine', () => {
    hot.deleteRow(0);
})

addListener('#disabled', () => {
    options.disabled = !options.disabled;
    hot.updateSettings();
})

window.table = hot.table

window.hot = hot


function addListener(selector, callback) {
    document
        .querySelector(selector)
        .addEventListener('click', callback, false)
}