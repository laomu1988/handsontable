var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @file 表格编辑文件
 */
var EventEmitter = require('eventemitter3');
var Handsontable = require('handsontable/dist/handsontable.full.min.js');
var FormulaParser = require('./formula');
var ObjectEditor = require('./object_editor');
var utils = require('./utils');

var colors = ['red', 'white', 'black', 'green', 'yellow', 'blue', 'purple', 'gray', 'brown', 'tan'];

var menu = {
    date: {
        name: '当前时间',
        callback: function callback(key, options) {
            var selected = options[0].start;
            this.setDataAtCell(selected.row, selected.col, utils.formatDateTime());
            console.log('当前时间:', selected);
        }
    },
    row_above: {
        name: '上面添加行'
    },
    row_below: {
        name: '下面添加行'
    },
    hsep1: '---------',
    col_left: {
        name: '左侧添加列'
    },
    col_right: {
        name: '右侧添加列'
    },
    hsep2: '---------',
    remove_row: {
        name: '删除行'
    },
    remove_col: {
        name: '删除列'
    },
    hsep3: '---------',
    undo: {
        name: '撤销'
    },
    redo: {
        name: '重做'
    },
    hsep4: '---------',
    // make_read_only: {name: '只读'},
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
    // commentsAddEdit: {name: '编辑注释'},
    // commentsRemove: {name: '移除注释'},
    bgcolor: {
        name: '背景色',
        submenu: {
            items: colors.map(function (v) {
                return {
                    key: 'bgcolor:' + v,
                    name: v,
                    callback: onClickMenu,
                    renderer: colorMenuRender
                };
            })
        }
    },
    color: {
        name: '文字颜色',
        submenu: {
            items: colors.map(function (v) {
                return {
                    key: 'color:' + v,
                    name: v,
                    callback: onClickMenu,
                    renderer: colorMenuRender
                };
            })
        }
    }
};

function onClickMenu(key, selection) {
    console.log('单元格颜色', key, selection);
    if (!selection || !selection[0] || !selection[0].start) {
        console.error('未知动作', key, selection);
    }
    var classPre = key.substring(0, key.indexOf(':'));
    var newClassName = key.replace(':', '-');
    var start = selection[0].start;
    var end = selection[0].end;
    var reg = new RegExp('\\b' + classPre + '-\\w+\\b', 'g');
    for (var row = start.row; row <= end.row; row++) {
        for (var col = start.col; col <= end.col; col++) {
            var meta = this.getCellMeta(row, col);
            var className = meta.className || '';
            className = className.replace(reg, '').trim() + ' ' + newClassName;
            this.setCellMetaObject(row, col, {
                className: className
            });
        }
    }
    this.render();
}

function colorMenuRender() {
    var elem = document.createElement('div');
    elem.classList.add(this.key.replace(':', '-'));
    elem.textContent = this.name;
    return elem;
}

/**
 * 新建一个hansontable编辑区
 * @param {Object} options 
 * @param {DOM} options.dom 编辑区所在dom
 * @param {Array} options.data 编辑区使用的数据
 * @param {Object} options.config 覆盖handsontable默认配置
 * @param {Object} options.disabled 是否禁止编辑，默认false
 * @param {Object} options.propAlias 属性的中文别名
 * @param {Object} options.commentNeedAlias 只有指定了别名，对象的属性才会展示在注释中，避免注释内容过多, 默认false
 * @param {Function} options.objectRender(obj) 当是Object对象时，转换为stirng展示在输入框中
 */

var TableEditor = function (_EventEmitter) {
    _inherits(TableEditor, _EventEmitter);

    function TableEditor(options) {
        _classCallCheck(this, TableEditor);

        var _this = _possibleConstructorReturn(this, (TableEditor.__proto__ || Object.getPrototypeOf(TableEditor)).call(this));

        var data = options.data || {};
        _this.originData = data instanceof Array ? data : data.data || [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']];
        _this.ready = false;
        _this.options = options;
        _this.dom = options.dom;
        _this.table = null; // hansontable编辑实例
        _this.mergeCells = options.mergeCells || data.mergeCells || [];
        options.metas = options.metas || data.metas || [];
        if (options.metas && !options.cell) {
            options.cell = options.metas.map(function (v) {
                return {
                    row: v.row,
                    col: v.col,
                    className: v.meta.className
                };
            });
        }
        _this.errorFields = [];
        // 公式计算实例
        _this.formulaParser = new FormulaParser(_this);
        _this.formulaParser.on('error', function (error) {
            return _this.emit('error', error);
        }); // 抛出错误

        // 转换object对象为字符串
        if (_this.originData && _this.originData.length > 0) {
            _this.originData = _this.originData.map(function (row) {
                if (row && row.length > 0 && row.map) {
                    return row.map(function (value) {
                        if (isObject(value)) {
                            return JSON.stringify(value);
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
        writeColorClass(colors);
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
                    var obj = utils.JSONParse(data);
                    if (typeof obj !== 'string') {
                        this.emit('dblclick-object', row, col, obj);
                    }
                }
            }
        }
    }, {
        key: 'createTable',
        value: function createTable() {
            this.table = new Handsontable(this.dom, this.getTableConfig());
            this.updateSettings();
        }
    }, {
        key: 'getTableConfig',
        value: function getTableConfig() {
            var me = this;
            var defaultConfig = {
                renderAllRows: true,
                rowHeaders: true,
                colHeaders: true,
                mergeCells: this.mergeCells, // 合并单元格
                // 右键菜单
                contextMenu: this.options.disabled ? false : {
                    items: menu
                },
                manualRowResize: this.options.disabled ? false : true, // 调整行高度
                manualColumnResize: this.options.disabled ? false : true, // 调整列宽度
                cells: this.getCellProp.bind(me), // this.cells,
                cell: this.options.cell || [],
                comments: true, // 展示注释
                readOnly: !!this.options.disabled,
                afterRemoveCol: function afterRemoveCol() {
                    me.update();
                },
                afterRemoveRow: function afterRemoveRow() {
                    me.update();
                },
                afterChange: function afterChange() {
                    me.update();
                },
                afterSelectionEnd: function afterSelectionEnd(row, col, row2, col2) {
                    me.ready = true;
                    me.emit('selection', row, col, row2, col2);
                    if (row2 === row && col2 === col) {
                        me.emit('select-cell', row, col);
                    }
                },
                afterUnmergeCells: function afterUnmergeCells(cellRange) {
                    var from = cellRange.from;
                    var index = me.mergeCells.findIndex(function (v) {
                        return v.row === from.row && v.col === from.col;
                    });
                    if (index >= 0) {
                        me.mergeCells.splice(index, 1);
                    }
                    me.update();
                },
                afterSetCellMeta: function afterSetCellMeta(row, col, key, value) {
                    // console.log('cell-meta:', row, col, key, value);
                    me.update();
                },

                minSpareRows: 1
            };
            var config = Object.assign({}, defaultConfig, this.options.config, {
                data: this.originData
            });
            return config;
        }
    }, {
        key: 'updateSettings',
        value: function updateSettings() {
            var _this2 = this;

            // 可编辑时才添加菜单
            this.table.updateSettings(this.getTableConfig());
            if (this.options.metas && this.options.metas.length > 0) {
                this.options.metas.forEach(function (v) {
                    _this2.table.setCellMetaObject(v.row, v.col, v.meta);
                });
            }
        }
    }, {
        key: 'insertRow',
        value: function insertRow(rowIndex, array) {
            var _this3 = this;

            this.table.alter('insert_row', rowIndex, 1);
            // this.originData.splice(rowIndex, 0, array)
            // todo：更新公式，合并单元格等信息
            array.forEach(function (value, col) {
                _this3.table.setDataAtCell(rowIndex, col, _this3.stringify(value));
            });
            this.render();
        }
    }, {
        key: 'deleteRow',
        value: function deleteRow(rowIndex) {
            var deleted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

            this.table.alter('remove_row', rowIndex, deleted);
            // todo：更新公式，合并单元格等信息
            this.render();
            console.log('data', this.originData);
        }
    }, {
        key: 'stringify',
        value: function stringify(data) {
            switch (typeof data === 'undefined' ? 'undefined' : _typeof(data)) {
                case 'string':
                case 'number':
                    return data;
                case 'undefined':
                    return '';
                default:
                    if (data === null) {
                        return '';
                    }
                    return JSON.stringify(data);
            }
        }
    }, {
        key: 'update',
        value: function update() {
            var _this4 = this;

            if (this.ready) {
                setTimeout(function () {
                    _this4.emit('change', _this4.originData);
                    _this4.emit('update', _this4.originData);
                }, 4);
            }
        }
        // 重新绘制表格

    }, {
        key: 'render',
        value: function render() {
            this.table.render();
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
                comment: '',
                editor: 'text',
                renderer: this.cellRender.bind(this)
            };
            if (this.options.disabled) {
                cellMeta.editor = false;
            }
            var data = this.originData[row] ? this.originData[row][col] : null;
            if (data && data[0] === '{') {
                var d = utils.JSONParse(data);
                if ((typeof d === 'undefined' ? 'undefined' : _typeof(d)) === 'object') {
                    cellMeta.comment = {
                        value: getCellName(row, col) + '\n' + this.getObjectComment(d)
                    };
                    cellMeta.editor = ObjectEditor;
                    if (d.readOnly || d.disabled) {
                        cellMeta.readOnly = true;
                    }
                }
            } else if (data && data[0] === '=') {
                cellMeta.comment = {
                    value: data
                };
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
            td.setAttribute('row', row);
            td.setAttribute('col', col);
            if (data && data[0] === '{') {
                var d = utils.JSONParse(data);
                if (typeof d === 'string') {
                    showValue = d;
                } else {
                    className = 'object';
                    if (d.className) {
                        className += ' ' + d.className;
                    }
                    if (this.options.objectRender) {
                        showValue = this.options.objectRender(d, row, col);
                    } else {
                        showValue = [d.name, d.value].filter(function (v) {
                            return typeof v !== 'undefined';
                        }).join(':');
                    }
                }
            } else if (data && data[0] === '=') {
                var result = this.formulaParser.parse(data.substr(1));
                if (result.error) {
                    console.error('formula-error:', data.substr(1), result.error, result);
                }
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
        // 取得编辑数据

    }, {
        key: 'getData',
        value: function getData() {
            this.originData = this.table.getData();
            return this.originData;
        }
        // 获取包含样式部分的数据

    }, {
        key: 'getDataWithFormat',
        value: function getDataWithFormat() {
            var cell = [];
            for (var i = 0; i < this.originData.length; i++) {
                var meta = this.table.getCellMetaAtRow(i);
                if (meta) {
                    meta.forEach(function (v) {
                        if (v.className) {
                            cell.push({
                                row: v.row,
                                col: v.col,
                                className: v.className.trim()
                            });
                        }
                    });
                }
            }
            var tds = [].concat(_toConsumableArray(this.dom.querySelectorAll('[rowspan][colspan]')));
            var merges = tds.map(function (td) {
                return {
                    row: parseInt(td.getAttribute('row')),
                    col: parseInt(td.getAttribute('col')),
                    rowspan: parseInt(td.getAttribute('rowspan')),
                    colspan: parseInt(td.getAttribute('colspan'))
                };
            });
            var data = {
                data: this.originData,
                mergeCells: merges,
                cell: cell
            };
            return data;
        }
        // 取得选择的单元格

    }, {
        key: 'getSelected',
        value: function getSelected() {
            var selected = this.table.getSelected();
            if (selected) {
                return selected[0];
            }
            return null;
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
                var result = this.formulaParser.parse(data.slice(1));
                if (!result.error) {
                    return result.result;
                }
                return data;
            } else if (data && data[0] === '{') {
                return utils.JSONParse(data);
            }
            return data;
        }
    }]);

    return TableEditor;
}(EventEmitter);

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

function writeColorClass(colors) {
    var style = '';
    colors.forEach(function (color) {
        style += '.bgcolor-' + color + ' {background-color: ' + color + ' !important;} \n.color-' + color + ' {color: ' + color + ' !important;}\n';
    });
    var dom = document.createElement('style');
    dom.setAttribute("type", "text/css");
    dom.innerHTML = style;
    console.log('writeStyle:', style);
    document.querySelector('head').appendChild(dom);
}

module.exports = TableEditor;