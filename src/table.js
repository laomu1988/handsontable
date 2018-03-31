/**
 * @file 表格编辑文件
 */
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
            console.log('callCellValue:', arguments)
            let row = this.originData[cellCoord.row.index]
            done(row[cellCoord.column.index])
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
        // 渲染表格
        var defaultConfig = {
            rowHeaders: true,
            colHeaders: true,
            mergeCells: true,
            contextMenu: true,
            afterChange() {
                console.log('afterChange:', this.renderData)
            },
            afterBeginEditing(rowIndex, colIndex) {
                console.log('afterBeginEditing:', arguments)
                if (originData[rowIndex] && originData[rowIndex][colIndex] && renderData[rowIndex][colIndex] !== originData[rowIndex][colIndex]) {
                    table.setDataAtCell(rowIndex, colIndex, originData[rowIndex][colIndex]);
                    console.log('setData:', originData[rowIndex][colIndex])
                }
            },
            afterSetDataAtCell(datas, action) {
                console.log('afterSetDataAtCell:', arguments)
                if (action && datas.length > 0) {
                    datas.forEach(info => {
                        let rowIndex = info[0]
                        let colIndex = info[1]
                        let oldData = info[2]
                        let newData = info[3]
                        updateOriginCell(rowIndex, colIndex, newData)
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
        this.renderData.forEach((arr, rowIndex)=> {
            arr.forEach((value, colIndex) => {
                if (value && value[0] === '=') {
                    this.parser(rowIndex, colIndex, value.substr(1))
                }
            })
        })
    }
    /**
     * 更新原始数据，编辑、合并单元格、删除等等操作
     */
    updateOriginCell(rowIndex, colIndex, value) {
        while(this.originData.length <= rowIndex) {
            this.originData.push([''])
        }
        let row = this.originData[rowIndex]
        while(row.length <= colIndex) {
            row.push('')
        }
        row[colIndex] = value
        if (value && value[0] === '=') {
            this.parser(rowIndex, colIndex, value.substr(1))
        }
    }
    parser(rowIndex, colIndex, formula) {
        console.log('formual:', formula)
        let result = this.formulaParser.parse(formula)
        if (!result.error) {
            if (this.table) {
                setTimeout(() => {
                    this.table.setDataAtCell(rowIndex, colIndex, result.result)
                }, 10)
            }
            else {
                this.renderData[rowIndex][colIndex] = result.result
            }
        }
        else {
            console.error('formualParserError:', formula, result.error)
        }
    }
}

module.exports = TableEditor