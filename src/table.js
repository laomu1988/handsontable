/**
 * @file 表格编辑文件
 */
var EventEmitter = require('eventemitter3');
require('./style.css')
const _ = require('lodash')
require('handsontable/dist/handsontable.full.min.css')
var Handsontable = require('handsontable/dist/handsontable.full.min.js')
var FormulaParser = require('hot-formula-parser').Parser
/**
 * 新建一个hansontable编辑区
 * @param {Object} options 
 * @param {DOM} options.dom 编辑区所在dom
 * @param {Array} options.data 编辑区使用的数据
 * @param {Object} options.config 覆盖默认配置
 */
class TableEditor extends EventEmitter {
    constructor(options) {
        super();
        this.originData = options.data
        this.renderData = _.cloneDeep(this.originData)
        this.options = options
        this.dom = options.dom
        this.formulaParser = null // 公式计算实例
        this.table = null // hansontable编辑实例
        this.cells = []
        this.errorFields = []
        this.createFormulaParser()
        this.originData.forEach((arr, row)=> {
            arr.forEach((value, col) => {
                this.updateCellMeta(row, col)
            })
        })
        console.log('this.cells:', this.cells)
        this.createTable()
    }
    createFormulaParser() {
        var parser = new FormulaParser()
        // 计算数据
        parser.on('callVariable', (name, done) => {
            console.log('callVariable:', arguments)
            done(0)
        });

        parser.on('callFunction', (name, params, done) => {
            console.log('callFunction:', arguments)
            done(0)
        });

        parser.on('callCellValue', (cellCoord, done) => {
            let row = this.originData[cellCoord.row.index]
            let data = row ? row[cellCoord.column.index] : null
            console.log('callCellValue:', cellCoord.row.index, cellCoord.column.index, data, arguments)
            done(data)
        });

        parser.on('callRangeValue', (startCellCoord, endCellCoord, done) => {
            console.log('callRangeValue:', arguments)
            var data = this.originData;
            var fragment = [];
            for (var row = startCellCoord.row.index; row <= endCellCoord.row.index; row++) {
            var rowData = data[row];
            var colFragment = [];
        
            for (var col = startCellCoord.column.index; col <= endCellCoord.column.index; col++) {
                colFragment.push(rowData[col]);
            }
            fragment.push(colFragment);
            }
        
            if (fragment) {
            done(fragment);
            }
        });
        this.formulaParser = parser;
    }
    onBeginEditing(row, col) {
        console.log('afterBeginEditing:', arguments)
        if (this.originData[row] && this.originData[row][col] && this.renderData[row][col] !== this.originData[row][col]) {
            let data = this.originData[row][col];
            if (typeof data === 'object' && data + '' === '[object Object]') {
                this.emit('select-object', row, col, data); // 触发可选择对象事件
            }
            else {
                this.table.setDataAtCell(row, col, this.originData[row][col]);
                console.log('setData:', this.originData[row][col])
            }
        }
    }
    onSelectedCell(row, col) {
        console.log('onSelectedCell', row, col);
        let data = this.originData[row] ? this.originData[row][col] : null
        this.emit('select-cell', row, col, data)
        if (typeof data === 'object' && data + '' === '[object Object]') {
            this.emit('select-object', row, col, data); // 触发可选择对象事件
        }
    }
    createTable() {
        let me = this;
        // 渲染表格
        var defaultConfig = {
            rowHeaders: true,
            colHeaders: true,
            mergeCells: true,
            contextMenu: true,
            cell: this.cells,
            afterChange() {
                console.log('afterChange:', this.renderData)
            },
            afterBeginEditing: this.onBeginEditing.bind(this),
            afterSelectionEnd(row, col, endRow, endCol) {
                if (row === endRow && col === endCol) {
                    // console.log('afterSelectionEnd:', arguments)
                    me.onSelectedCell(row, col)
                }
            },
            afterSetDataAtCell(datas, action) {
                console.log('afterSetDataAtCell:', arguments)
                if (action && datas.length > 0) {
                    datas.forEach(info => {
                        let row = info[0]
                        let col = info[1]
                        let oldData = info[2]
                        let newData = info[3]
                        me.setDataAtCell(row, col, newData)
                    })
                }
            },
            afterSetCellMeta: function (row, col, key, val) {
                console.log("cell meta changed", row, col, key, val);
            },
            minSpareRows: 1
        }
        let config = Object.assign({}, defaultConfig, this.options.config, {data: this.renderData})
        this.table = new Handsontable(this.dom, config)
    }
    /**
     * 更新原始数据，编辑、合并单元格、删除等等操作
     */
    setDataAtCell(row, col, value) {
        console.log('setDataAtCell:', row, col, value)
        while(this.originData.length <= row) {
            this.originData.push([''])
        }
        let rowData = this.originData[row]
        while(rowData.length <= col) {
            rowData.push('')
        }
        rowData[col] = value
        this.updateCellMeta(row, col)
        this.emit('update', this.originData)
    }
    // 更新单元格的属性
    updateCellMeta(row, col) {
        let value = this.originData[row][col]
        let changed = false
        let meta = {
            row,
            col,
            className: '',
            readOnly: false
        }
        if (value && value[0] === '=') {
            let result = this.parser(row, col, value.substr(1))
            meta.className = result.error ? 'error' : 'formula'
            value = result.error ? value : result.result
            console.log('parser:', value, result)
        }
        else if(value && value + '' === '[object Object]') {
            meta.className = 'object'
            meta.readOnly = true
            value = value.name || value.text
        }
        let index = this.cells.findIndex(v => v.row === row && v.col === col);
        if (index >= 0) {
            this.cells.splice(index, 1)
        }
        if (meta.className || meta.readOnly) {
            this.cells.push(meta)
        }

        console.log('setRenderData:', row, col, value)
        if (this.table) {
            // 设置表的数据需要延迟
            setTimeout(() => {
                this.table.setCellMetaObject(row, col, meta)
                this.table.setDataAtCell(row, col, value)
                this.render()
            }, 100)
        }
        else {
            this.renderData[row][col] = value
        }
    }
    clearCellClassName(row, col) {
        this.table.setCellMetaObject(row, col, {className: '', readOnly: false})
        this.render()
        let flag = -1;
        let index = this.cells.findIndex(d => d.row === row && d.col === col)
        if (index > 0) {
            this.cells.splice(flag, 1)
        }
        console.log('cells', this.cells);
    }
    // 计算公式的值
    parser(row, col, formula) {
        console.log('formual:', row, col, formula)

        // 转换对象数据属性，例如E2.value
        formula = formula.replace(/([A-Z]\w*)(\d+)\.(\w+)/g, (all, col, row, attr) => {
            col = getColByColName(col)
            row = parseInt(row, 10) - 1
            let rowData = this.originData[row]
            if (rowData) {
                console.log('rowData:', rowData)
                let data = rowData[col]
                return data[attr] || 0
            }
            return 0
        })

        // 使用公式计算出结果
        return this.formulaParser.parse(formula)
    }
    render() {
        if (this._isRender) {
            return;
        }
        this._isRender = true
        setTimeout(() => {
            console.log('render')
            this.table && this.table.render()
            this._isRender = false
        }, 50)
    }
    getData() {
        return this.originData
    }
}

/**
 * 根据列名称取得是第几列
 * @param {*} name 列名称，例如'A', 'AB'
 */
function getColByColName(name) {
    let codeA = 'A'.charCodeAt(0) - 1
    let value = 0
    if (name.length === 1) {
        return name.charCodeAt(0) - codeA - 1
    }
    let array = name.split('').reverse().forEach((char, index) => {
        value += (char.charCodeAt(0) - codeA) * Math.pow(26, index)
    })
    return value - 1
}

module.exports = TableEditor