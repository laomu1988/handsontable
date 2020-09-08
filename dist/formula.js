var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @file 表格公式计算部分
 */

var FormulaParser = require('hot-formula-parser').Parser;
var utils = require('./utils');

module.exports = function (_FormulaParser) {
    _inherits(Formula, _FormulaParser);

    function Formula(table) {
        var _arguments = arguments;

        _classCallCheck(this, Formula);

        var _this = _possibleConstructorReturn(this, (Formula.__proto__ || Object.getPrototypeOf(Formula)).call(this));

        _this.table = table;
        _this.parserIndexes = {};
        _this.timerIndexes = {};

        // 计算数据
        // this.on('callVariable', (name, done) => {
        //     console.log('callVariable:', arguments)
        //     done(0)
        // });
        _this.setFunction('DateToNumber', function (params) {
            // console.log('DateToNumber:', params);
            try {
                var date = new Date(params[0]);
                return date.getTime() / 1000;
            } catch (err) {
                console.error('非法时间：', params[0], err);
            }
        });
        _this.setFunction('NumberToDate', function (params) {
            // console.log('NumberToDate:', params);
            try {
                var date = new Date(parseFloat(params[0]) * 1000);
                return utils.formatDateTime(date);
            } catch (err) {
                console.error('非法数字时间：', params[0], err);
            }
        });

        // this.on('callFunction', (name, params, done) => {
        //     console.log('callFunction:', name, params);           
        //     // done(0)
        // });

        _this.on('callCellValue', function (cellCoord, done) {
            var row = _this.table.originData[cellCoord.row.index];
            var data = row ? row[cellCoord.column.index] : null;
            // console.log('callCellValue:', cellCoord.row.index, cellCoord.column.index, data, arguments)
            var indexes = cellCoord.row.index + '_' + cellCoord.column.index;
            _this.parserIndexes[indexes] = _this.parserIndexes[indexes] || 0;
            _this.parserIndexes[indexes] += 1;
            if (_this.parserIndexes[indexes] > 1000) {
                var message = '计算公式存在循环' + (cellCoord.row.index + 1) + '行' + (cellCoord.column.index + 1) + '列';
                console.error(message);
                _this.emit('error', message);
                throw new Error(message);
            }
            if (_this.timerIndexes[indexes]) {
                clearTimeout(_this.timerIndexes[indexes]);
            }
            _this.timerIndexes[indexes] = setTimeout(function () {
                delete _this.parserIndexes[indexes];
            }, 1000);
            if (data && data[0] === '=') {
                var result = _this.parse(data.substr(1));
                if (result.error) {
                    console.error('FormulaParserError:', result);
                    throw new Error('公式计算错误');
                }
                data = result.result;
            } else if (data && data[0] === '{') {
                data = utils.JSONParse(data);
            }
            console.log('callCellValue:', indexes, data);
            done(data);
        });

        _this.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
            console.log('callRangeValue:', _arguments);
            var data = _this.table.originData;
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
        return _this;
    }
    // 公式计算，避免对象等数据转换失败问题


    _createClass(Formula, [{
        key: 'parse',
        value: function parse(formula) {
            var _this2 = this;

            var alias = this.table.alias;
            if (alias) {
                formula = formula.replace(/[^\.\s\+\-\*\/\(\)]+/g, function (word) {
                    // console.log('word', word)
                    return alias[word] || word;
                });
            }
            try {
                // console.log('formula:', formula)
                // 转换对象数据属性，例如E2.value
                formula = formula.replace(/([A-Z]\w*)(\d+)\.(\w+)/g, function (all, col, row, attr) {
                    col = getColByColName(col);
                    row = parseInt(row, 10) - 1;
                    var rowData = _this2.table.originData[row];
                    if (rowData) {
                        // console.log('rowData:', rowData)
                        var data = rowData[col];
                        if (data && data[0] === '{') {
                            data = utils.JSONParse(data);
                        }
                        return data[attr] || 0;
                    }
                    return 0;
                });
            } catch (error) {
                return {
                    error: error
                };
            }

            // 使用公式计算出结果
            // console.log('计算公式：', formula);
            return _get(Formula.prototype.__proto__ || Object.getPrototypeOf(Formula.prototype), 'parse', this).call(this, formula);
        }
    }]);

    return Formula;
}(FormulaParser);

/**
 * 根据列名称取得是第几列
 * @param {*} name 列名称，例如'A', 'AB'
 */
function getColByColName(name) {
    var codeA = 'A'.charCodeAt(0) - 1;
    var value = 0;
    if (name.length === 1) {
        return name.charCodeAt(0) - codeA - 1;
    }
    name.split('').reverse().forEach(function (char, index) {
        value += (char.charCodeAt(0) - codeA) * Math.pow(26, index);
    });
    return value - 1;
}