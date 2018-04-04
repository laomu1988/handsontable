/**
 * @file 表格编辑文件
 */
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
class TableEditor {
    constructor(options) {
        this.originData = options.data
        this.renderData = _.cloneDeep(this.originData)
        this.options = options
        this.dom = options.dom
        this.formulaParser = null // 公式计算实例
        this.table = null // hansontable编辑实例
        this.formulaFields = []
        this.errorFields = []
        this.createFormulaParser()
        this.updateRenderData()
        this.createTable()
    }
    createFormulaParser() {
        var parser = new FormulaParser()
        
        // 计算数据
        parser.on('callVariable', (name, done) => {
            console.log('callVariable:', arguments)
            if (name === 'foo') {
            done(Math.PI / 2);
            }
        });

        parser.on('callFunction', (name, params, done) => {
            console.log('callFunction:', arguments)
            if (name === 'ADD_5') {
            done(params[0] + 5);
            }
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
    getTableConfig() {
        let me = this;
        // 渲染表格
        var defaultConfig = {
            rowHeaders: true,
            colHeaders: true,
            mergeCells: true,
            contextMenu: true,
            cell: this.formulaFields,
            afterChange() {
                console.log('afterChange:', this.renderData)
            },
            afterBeginEditing(row, col) {
                console.log('afterBeginEditing:', arguments)
                if (me.originData[row] && me.originData[row][col] && me.renderData[row][col] !== me.originData[row][col]) {
                    me.table.setDataAtCell(row, col, me.originData[row][col]);
                    console.log('setData:', me.originData[row][col])
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
                        me.updateOriginCell(row, col, newData)
                    })
                }
            },
            afterSetCellMeta: function (row, col, key, val) {
                console.log("cell meta changed", row, col, key, val);
            },
            minSpareRows: 1
        }
        return Object.assign({}, defaultConfig, this.options.config, {data: this.renderData})
    }
    createTable() {
        this.table = new Handsontable(this.dom, this.getTableConfig())
    }
    /**
     * 更新渲染数据，将公式部分转化为计算后的值
     */
    updateRenderData() {
        this.clearClassName()
        this.originData.forEach((arr, row)=> {
            arr.forEach((value, col) => {
                if (value && value[0] === '=') {
                    this.parser(row, col, value.substr(1))
                }
                else if (value + '' === '[object Object]') {
                    this.renderData[row][col] = value.name || value.text
                    this.addCellClassName(row, col, 'selected')
                    if (this.table) {
                        this.table.setDataAtCell(row, col, value.name || value.text)
                    }
                }
            })
        })
    }
    /**
     * 更新原始数据，编辑、合并单元格、删除等等操作
     */
    updateOriginCell(row, col, value) {
        while(this.originData.length <= row) {
            this.originData.push([''])
        }
        let rowData = this.originData[row]
        while(rowData.length <= col) {
            rowData.push('')
        }
        rowData[col] = value
        if (value && value[0] === '=') {
            this.parser(row, col, value.substr(1))
        }
        else {
            this.clearCellClassName(row, col)
        }
    }
    // 清空所有已指定的className
    clearClassName() {
        this.formulaFields.forEach(d => {
            let oldClassName = this.table.getCellMeta(d.row, d.col, 'className').className || '';
            this.table && this.table.setCellMeta(d.row, d.col, 'className', oldClassName.replace(/formula/g, '').replace(/error/g, ''))
            this.render()
        })
        this.formulaFields = []
    }
    clearCellClassName(row, col) {
        let flag = -1;
        let field = this.formulaFields.find((d,index) => {
            flag = index
            return d.row === row && d.col === col
        })
        if (field && this.table) {
            let oldClassName = this.table.getCellMeta(row, col, 'className').className || '';
            this.table.setCellMeta(row, col, 'className', oldClassName.replace(/formula/g, '').replace(/error/g, ''))
            this.render()
        }
        this.formulaFields.splice(flag, 1)
        console.log('formulaFields', this.formulaFields);
    }
    addCellClassName(row, col, className) {
        if (this.table) {
            let oldClassName = this.table.getCellMeta(row, col, 'className').className || '';
            if (oldClassName) {
                oldClassName = oldClassName.replace(/formula/g, '').replace(/error/g, '')
            }
            this.table.setCellMeta(row, col, 'className', oldClassName + ' ' + className)
            this.render()
        }
        let field = this.formulaFields.find(d => {
            return d.row === row && d.col === col
        })
        if (field) {
            field.className = className;
        }
        else {
            this.formulaFields.push({row, col, className: className});
        }
        console.log('formulaFields:', this.formulaFields)
    }
    // 转换自选数据，例如E2.value
    parserFormulaSelected(formual) {
        return formual.replace(/([A-Z]\w*)(\d+)\.(\w+)/g, (all, col, row, attr) => {
            col = this.getColByChar(col)
            row = parseInt(row, 10) - 1
            let rowData = this.originData[row]
            if (rowData) {
                console.log('rowData:', rowData)
                let data = rowData[col]
                return data[attr] || 0
            }
            return 0
        })
    }
    getColByChar(colChar) {
        let codeA = 'A'.charCodeAt(0) - 1
        let value = 0
        if (colChar.length === 1) {
            return colChar.charCodeAt(0) - codeA - 1
        }
        let array = colChar.split('').reverse().forEach((char, index) => {
            value += (char.charCodeAt(0) - codeA) * Math.pow(26, index)
        })
        return value - 1
    }
    parser(row, col, formula) {
        console.log('formual:', formula)
        formula = this.parserFormulaSelected(formula)
        let result = this.formulaParser.parse(formula)
        if (!result.error) {
            if (this.table) {
                setTimeout(() => {
                    this.table.setDataAtCell(row, col, result.result)
                }, 10)
            }
            else {
                this.renderData[row][col] = result.result
            }
            this.addCellClassName(row, col, 'formula')
        }
        else {
            this.addCellClassName(row, col, 'error')
            console.error('formualParserError:', formula, result.error)
        }
    }
    render() {
        if (this._isRender) {
            return;
        }
        this._isRender = true
        setTimeout(() => {
            this.table && this.table.render()
            this._isRender = false
        }, 50)
    }
    getData() {
        return this.originData
    }
}

module.exports = TableEditor