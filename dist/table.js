var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @file 表格编辑文件
 */
var EventEmitter = require('eventemitter3');
var Handsontable = require('handsontable/dist/handsontable.full.min.js');
var FormulaParser = require('hot-formula-parser').Parser;
var menu = {
    row_above: { name: '上面添加行' },
    row_below: { name: '下面添加行' },
    hsep1: '---------',
    col_left: { name: '左侧添加列' },
    col_right: { name: '右侧添加列' },
    hsep2: '---------',
    remove_row: { name: '删除行' },
    remove_col: { name: '删除列' },
    hsep3: '---------',
    undo: { name: '撤销' },
    redo: { name: '重做' },
    hsep4: '---------',
    make_read_only: { name: '只读' },
    alignment: {
        name: '对齐方式'
        // submenu: {
        //     items: {
        //         'alignment:left': {name: '左对齐'},
        //         'alignment:middle': {name: '文字居中'},
        //         'alignment:right': {name: '右对齐'},
        //         'alignment:top': {name: '顶部展示'},
        //         'alignment:bottom': {name: '底部展示'},
        //         'alignment:center': {name: '中部对齐'},
        //     }
        // }
    },
    mergeCells: {
        name: '合并/拆分单元格'
    },
    // borders: {name: '边框'},
    hsep5: '---------',
    commentsAddEdit: { name: '编辑注释' },
    commentsRemove: { name: '移除注释' }
    /**
     * 新建一个hansontable编辑区
     * @param {Object} options 
     * @param {DOM} options.dom 编辑区所在dom
     * @param {Array} options.data 编辑区使用的数据
     * @param {Object} options.config 覆盖handsontable默认配置
     * @param {Object} options.disabled 是否禁止编辑，默认false
     * @param {Object} options.propAlias 属性的中文别名
     * @param {Object} options.commentNeedAlias 只有指定了别名，对象的属性才会展示在注释中，避免注释内容过多, 默认false
     */
};
var TableEditor = function (_EventEmitter) {
    _inherits(TableEditor, _EventEmitter);

    function TableEditor(options) {
        _classCallCheck(this, TableEditor);

        var _this = _possibleConstructorReturn(this, (TableEditor.__proto__ || Object.getPrototypeOf(TableEditor)).call(this));

        _this.originData = options.data;
        _this.options = options;
        _this.dom = options.dom;
        _this.formulaParser = null; // 公式计算实例
        _this.table = null; // hansontable编辑实例
        _this.errorFields = [];
        _this.createFormulaParser();

        // 转换object对象为字符串
        if (_this.originData && _this.originData.length > 0) {
            _this.originData = _this.originData.map(function (row) {
                if (row && row.length > 0 && row.map) {
                    return row.map(function (value) {
                        if (isObject(value)) {
                            return new String(JSON.stringify(value));
                        }
                        return value;
                    });
                }
                return [];
            });
        }
        if (_this.options.propAlias) {
            var alias = _this.options.propAlias;
            _this.alias = {};
            for (var attr in alias) {
                _this.alias[alias[attr]] = attr;
            }
        }
        _this.createTable();
        _this.dom.addEventListener('dblclick', _this.onDblclick.bind(_this), false);
        return _this;
    }

    _createClass(TableEditor, [{
        key: 'onDblclick',
        value: function onDblclick(e) {
            var target = e.target || {};
            if (target.tagName === 'TD') {
                var col = target.cellIndex - 1;
                var row = target.parentElement.rowIndex - 1;
                var data = this.originData[row] ? this.originData[row][col] : null;
                this.emit('dblclick', row, col, data);
                if (data && data[0] === '{') {
                    this.emit('dblclick-object', row, col, data.origin || JSON.parse(data));
                }
            }
        }
    }, {
        key: 'createFormulaParser',
        value: function createFormulaParser() {
            var _arguments = arguments,
                _this2 = this;

            var parser = new FormulaParser();
            // 计算数据
            parser.on('callVariable', function (name, done) {
                console.log('callVariable:', _arguments);
                done(0);
            });

            parser.on('callFunction', function (name, params, done) {
                console.log('callFunction:', _arguments);
                done(0);
            });

            parser.on('callCellValue', function (cellCoord, done) {
                var row = _this2.originData[cellCoord.row.index];
                var data = row ? row[cellCoord.column.index] : null;
                console.log('callCellValue:', cellCoord.row.index, cellCoord.column.index, data, _arguments);
                done(data);
            });

            parser.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
                console.log('callRangeValue:', _arguments);
                var data = _this2.originData;
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
    }, {
        key: 'createTable',
        value: function createTable() {
            var me = this;
            // 渲染表格
            var defaultConfig = {
                rowHeaders: true,
                colHeaders: true,
                mergeCells: true, // 合并单元格
                contextMenu: true, // 右键菜单
                manualRowResize: true, // 调整行高度
                manualColumnResize: true, // 调整列宽度
                cells: this.getCellProp.bind(me), // this.cells,
                comments: true, // 展示注释
                afterChange: function afterChange() {
                    // console.log('afterChange:', me.originData)
                    me.emit('change', me.originData);
                    me.emit('update', me.originData);
                },
                afterSelectionEnd: function afterSelectionEnd(row, col, row2, col2) {
                    // console.log('selection', row, col, row2, col2)
                    me.emit('selection', row, col, row2, col2);
                    if (row2 === row && col2 === col) {
                        me.emit('select-cell', row, col);
                    }
                },

                minSpareRows: 1
            };
            var config = Object.assign({}, defaultConfig, this.options.config, { data: this.originData });
            this.table = new Handsontable(this.dom, config);
            this.table.updateSettings({
                contextMenu: {
                    items: menu
                }
            });
        }
        // 设置单元格数据

    }, {
        key: 'setDataAtCell',
        value: function setDataAtCell(row, col, value) {
            if (isObject(value)) {
                value = JSON.stringify(value);
            }
            this.table.setDataAtCell(row, col, value);
        }
        // 取得对象注释数据

    }, {
        key: 'getObjectComment',
        value: function getObjectComment(obj) {
            var aliasShow = [];
            var show = [];
            var alias = this.options.propAlias;
            for (var attr in obj) {
                if (alias && alias[attr]) {
                    aliasShow.push(alias[attr] + '(' + attr + '): ' + obj[attr]);
                } else if (!this.options.commentNeedAlias) {
                    show.push(attr + ': ' + obj[attr]);
                }
            }
            return aliasShow.concat(show).join('\n');
        }
    }, {
        key: 'getCellProp',
        value: function getCellProp(row, col, prop) {
            // console.log('getCellProp', row, col)
            var cellMeta = {
                renderer: this.cellRender.bind(this)
            };
            if (this.options.disabled) {
                cellMeta.editor = false;
            }
            var data = this.originData[row] ? this.originData[row][col] : null;
            if (data && data[0] === '{') {
                try {
                    var d = data.origin || JSON.parse(data);
                    data.origin = d;
                    cellMeta.comment = { value: getCellName(row, col) + '\n' + this.getObjectComment(d) };
                    cellMeta.readOnly = true;
                } catch (err) {
                    console.log('JSON.prase Error', data, err);
                }
            } else if (data && data[0] === '=') {
                cellMeta.comment = { value: data };
            }
            return cellMeta;
        }
    }, {
        key: 'cellRender',
        value: function cellRender(instance, td, row, col, prop, value, cellProperties) {
            // console.log('cellRender')
            Handsontable.renderers.TextRenderer.apply(this, arguments);
            var data = this.originData[row] ? this.originData[row][col] : null;
            var className = null;
            var showValue = null;
            if (data && data[0] === '{') {
                try {
                    var d = data.origin || JSON.parse(data);
                    data.origin = d;
                    className = 'object';
                    showValue = d.name;
                } catch (err) {
                    console.log('JSON.prase Error', data, err);
                }
            } else if (data && data[0] === '=') {
                var result = this.parser(data.substr(1));
                className = result.error ? 'error' : 'formula';
                showValue = result.error ? data : result.result;
                // console.log('parser:', data, result)
            }
            if (className) {
                td.classList.add(className);
            }
            if (showValue !== null) {
                // console.log('showValue', showValue)
                td.innerHTML = showValue;
            }
            return td;
        }
        // 计算公式的值

    }, {
        key: 'parser',
        value: function parser(formula) {
            var _this3 = this;

            var alias = this.alias;
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
                    var rowData = _this3.originData[row];
                    if (rowData) {
                        // console.log('rowData:', rowData)
                        var data = rowData[col];
                        return data[attr] || 0;
                    }
                    return 0;
                });
            } catch (error) {
                return { error: error };
            }

            // 使用公式计算出结果
            return this.formulaParser.parse(formula);
        }
    }, {
        key: 'getData',
        value: function getData() {
            return this.originData;
        }
        // 取得单元格原始数据

    }, {
        key: 'getCellOrigin',
        value: function getCellOrigin(row, col) {
            return this.originData[row] ? this.originData[row][col] : null;
        }
        // 取得单元格计算后数据

    }, {
        key: 'getCellData',
        value: function getCellData(row, col) {
            var data = this.originData[row] ? this.originData[row][col] : null;
            if (data && data[0] === '=') {
                var result = this.parser(data.slice(1));
                if (!result.error) {
                    return result.result;
                }
                return data;
            } else if (data && data[0] === '{') {
                try {
                    return JSON.parse(data);
                } catch (err) {
                    console.error('JSON.parse Error', err);
                }
            }
            return data;
        }
    }]);

    return TableEditor;
}(EventEmitter);

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
    var array = name.split('').reverse().forEach(function (char, index) {
        value += (char.charCodeAt(0) - codeA) * Math.pow(26, index);
    });
    return value - 1;
}
var charArray = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function getCellName(row, col) {
    var colName = '';
    while (col >= 26) {
        var number = col % 26;
        colName = charArray[number] + colName;
        col = parseInt((col - number) / 26, 10) - 1;
    }
    colName = charArray[col] + colName;
    return colName + (row + 1);
}

function isObject(data) {
    return data && (typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object' && data + '' === '[object Object]';
}

module.exports = TableEditor;
