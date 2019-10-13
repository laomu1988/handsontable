/**
 * @file 表格公式计算部分
 */

const FormulaParser = require('hot-formula-parser').Parser;
const utils = require('./utils');

module.exports = class Formula extends FormulaParser {
    constructor(table) {
        super();
        this.table = table;
        this.parserIndexes = {};

        // 计算数据
        // this.on('callVariable', (name, done) => {
        //     console.log('callVariable:', arguments)
        //     done(0)
        // });
        this.setFunction('DateToNumber', function (params) {
            // console.log('DateToNumber:', params);
            try {
                let date = new Date(params[0]);
                return date.getTime() / 1000;
            } catch (err) {
                console.error('非法时间：', params[0], err);
            }
        });
        this.setFunction('NumberToDate', function (params) {
            // console.log('NumberToDate:', params);
            try {
                let date = new Date(parseFloat(params[0]) * 1000);
                return utils.formatDateTime(date);
            } catch (err) {
                console.error('非法数字时间：', params[0], err);
            }
        });

        // this.on('callFunction', (name, params, done) => {
        //     console.log('callFunction:', name, params);           
        //     // done(0)
        // });

        this.on('callCellValue', (cellCoord, done) => {
            let row = this.table.originData[cellCoord.row.index]
            let data = row ? row[cellCoord.column.index] : null
            // console.log('callCellValue:', cellCoord.row.index, cellCoord.column.index, data, arguments)
            let indexes = cellCoord.row.index + '_' + cellCoord.column.index;
            this.parserIndexes[indexes] = this.parserIndexes[indexes] || 0;
            this.parserIndexes[indexes] += 1;
            // if (this.parserIndexes[indexes] > 1000) {
            //     let message = '计算公式存在循环'
            //         + (cellCoord.row.index + 1) + '行'
            //         + (cellCoord.column.index + 1) + '列';
            //     console.error(message);
            //     throw new Error(message);
            // }
            if (data && data[0] === '=') {
                let result = this.parse(data.substr(1))
                if (result.error) {
                    console.error('FormulaParserError:', result)
                    throw new Error('公式计算错误');
                }
                data = result.result;
            } else if (data && data[0] === '{') {
                data = utils.JSONParse(data)
            }
            console.log('callCellValue:', indexes, data);
            done(data)
        });

        this.on('callRangeValue', (startCellCoord, endCellCoord, done) => {
            console.log('callRangeValue:', arguments)
            var data = this.table.originData;
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
    }
    // 公式计算，避免对象等数据转换失败问题
    parse(formula) {
        let alias = this.table.alias
        if (alias) {
            formula = formula.replace(/[^\.\s\+\-\*\/\(\)]+/g, function (word) {
                // console.log('word', word)
                return alias[word] || word
            })
        }
        try {
            // console.log('formula:', formula)
            // 转换对象数据属性，例如E2.value
            formula = formula.replace(/([A-Z]\w*)(\d+)\.(\w+)/g, (all, col, row, attr) => {
                col = getColByColName(col)
                row = parseInt(row, 10) - 1
                let rowData = this.table.originData[row]
                if (rowData) {
                    // console.log('rowData:', rowData)
                    let data = rowData[col]
                    if (data && data[0] === '{') {
                        data = utils.JSONParse(data)
                    }
                    return data[attr] || 0
                }
                return 0
            })
        } catch (error) {
            return {
                error
            }
        }

        // 使用公式计算出结果
        // console.log('计算公式：', formula);
        return super.parse(formula);
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
    name.split('').reverse().forEach((char, index) => {
        value += (char.charCodeAt(0) - codeA) * Math.pow(26, index)
    })
    return value - 1
}