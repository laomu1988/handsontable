# 可编辑公式的表格
* [x] 公式单元格展示计算结果
* [x] 点击公式单元格展示并可编辑公式
* [x] 公式单元格黄色背景
* [x] 非法数据红色背景
* [x] 撤销和重做、粘贴等数据更新
* [ ] 中间插入或删除行或列时，更新所有公式中包含了底部或右侧区域的内容
* [x] 禁止编辑状态
* [x] 数据修改后其他依赖该数据的需要重新计算
* [ ] 可下拉选择数据
* [ ] 菜单改为中文
* [x] 公式默认展示计算结果，hover时提示公式内容
* [x] 支持Object对象属性计算
* [x] Object对象预览
* [x] Object对象属性别名

## 示例
```
require('@laomu/handsontable/dist/style.css')
const Tabel = require('@laomu/handsontable')
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

// 需要选择object数据时触发
hot.on('dblclick-object', function(row, col, data) {
    console.log('select:', row, col, data);
    setTimeout(() => {
        let value = data.value
        hot.setDataAtCell(row, col, {
            name: 'selected:' + (value + 1),
            value: (value + 1)
        })
    }, 1000)
});


```

## 事件
* dblclick(row, col, data) 点击单元格触发
* dblclick-object(row, col, obj) 点击了对象单元格
* change/update(array) 数据更新事件

## 方法
* getData() 获取数据
* setDataAtCell(row, col, data) 设置单元格的值
* getCellData(row, col) 获取单元格计算后的值
* getCellOrigin(row, col) 获取单元格原始数据

## 相关链接
* 事件列表：https://docs.handsontable.com/pro/1.18.1/tutorial-using-callbacks.html
* 公式计算：https://github.com/handsontable/formula-parser