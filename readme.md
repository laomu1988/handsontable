# 可编辑公式的表格
* [x] 公式单元格展示计算结果
* [x] 点击公式单元格展示并可编辑公式
* [x] 公式单元格黄色背景
* [x] 非法数据红色背景
* [x] 撤销和重做、粘贴等数据更新
* [ ] 中间插入或删除行或列时，更新所有公式中包含了底部或右侧区域的内容
* [x] 调整宽度
* [x] 禁止编辑状态
* [x] 数据修改后其他依赖该数据的需要重新计算
* [ ] 可下拉选择数据
* [x] 菜单改为中文
* [x] 公式默认展示计算结果，hover时提示公式内容
* [x] 支持Object对象属性计算
* [x] Object对象预览
* [x] Object对象属性别名
* [x] Object对象删除
* [x] Object对象复制
* [x] 公式中引用另一个单元格的计算结果
* [ ] 条件表达式
* [ ] SUM等区域函数

## [效果预览](https://laomu1988.github.io/handsontable/)
<a href="https://laomu1988.github.io/handsontable/" target="_blank"><img src="https://raw.githubusercontent.com/laomu1988/handsontable/master/doc/preview.png"></a>

## 示例（参考src/example.js）
```
require('@laomu/handsontable/dist/style.css')
const Tabel = require('@laomu/handsontable')
var data = [
    ['说明', '内容', '内容'],
    ['数据', 10, 11],
    ['字符串', 'AAA', ''],
    ['对象', {name: '对象A', value: 123, hide: false}, {name: '对象B', value: 133}],
    ['公式', '=B2+C2'],
    ['错误示例', '=B1+B2'],
    ['对象属性计算', '=B4.value + 1'],
    ['别名计算示例', '=B4.值 + 1'],
    ['不存在的属性', '=B4.notExist'],
    ['公式套公式', '=B5 + 10'],
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
hot.on('dblclick-object', function(row, col, data) {
    console.log('select:', row, col, data);
    setTimeout(() => {
        let value = data.value
        hot.setDataAtCell(row, col, {
            name: '值:' + (value + 1),
            value: (value + 1)
        })
    }, 1000)
});
```

## 初始化参数
* dom 编辑区所在dom
* data 编辑区使用的数据
* config 覆盖handsontable默认配置
* disabled 是否禁止编辑，默认false
* propAlias 对象属性的中文别名
* commentNeedAlias 只有指定了别名，对象的属性才会展示在注释中，避免注释内容过多, 默认false

## 事件
* dblclick(row, col, data) 点击单元格触发
* dblclick-object(row, col, obj) 点击了对象单元格
* selection(row1, col1, row2, col2) 选中了某个区域时触发
* select-cell(row, col) 选择了某个单元格时触发
* change/update(array) 数据更新事件

## 方法
* getData() 获取数据
* setDataAtCell(row, col, data) 设置单元格的值
* getCellData(row, col) 获取单元格计算后的值
* getCellOrigin(row, col) 获取单元格原始数据

## 相关链接
* handsantable: https://github.com/handsontable/handsontable
* handsantable事件列表: https://docs.handsontable.com/pro/1.18.1/tutorial-using-callbacks.html
* formula-parser公式计算: https://github.com/handsontable/formula-parser

## 版本
* v1.0.4
    - 对象可复制、删除
    - 公式嵌套公式