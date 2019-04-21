/**
 * @file 表格编辑文件
 */
const EventEmitter = require('eventemitter3');
const Handsontable = require('handsontable/dist/handsontable.full.min.js')
const FormulaParser = require('hot-formula-parser').Parser
const ObjectEditor = require('./object_editor');
const menu = {
    row_above: {name: '上面添加行'},
    row_below: {name: '下面添加行'},
    hsep1: '---------',
    col_left: {name: '左侧添加列'},
    col_right: {name: '右侧添加列'},
    hsep2: '---------',
    remove_row: {name: '删除行'},
    remove_col: {name: '删除列'},
    hsep3: '---------',
    undo: {name: '撤销'},
    redo: {name: '重做'},
    hsep4: '---------',
    make_read_only: {name: '只读'},
    alignment: {
        name: '对齐方式',
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
        name: '合并/拆分单元格',
    },
    // borders: {name: '边框'},
    hsep5: '---------',
    commentsAddEdit: {name: '编辑注释'},
    commentsRemove: {name: '移除注释'}
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
class TableEditor extends EventEmitter {
    constructor(options) {
        super();
        let data = options.data || {}
        this.originData = data instanceof Array ? data : data.data || [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
        ]
        this.ready = false;
        this.options = options
        this.dom = options.dom
        this.formulaParser = null // 公式计算实例
        this.table = null // hansontable编辑实例
        this.mergeCells = options.mergeCells || data.mergeCells || []
        options.metas = options.metas || data.metas || []
        if (options.metas && !options.cell) {
            options.cell = options.metas.map(v => {
                return {
                    row: v.row,
                    col: v.col,
                    className: v.meta.className
                }
            })
        }
        this.errorFields = []
        this.createFormulaParser()

        // 转换object对象为字符串
        if (this.originData && this.originData.length > 0) {
            this.originData = this.originData.map(row => {
                if (row && row.length > 0 && row.map) {
                    return row.map(value => {
                        if (isObject(value)) {
                            return JSON.stringify(value)
                        }
                        return value
                    })
                }
                return []
            })
        }
        if (this.options.propAlias) {
            let alias = this.options.propAlias
            this.alias = {}
            for(let attr in alias) {
                this.alias[alias[attr]] = attr
            }
        }
        this.createTable()
        this.dom.addEventListener('dblclick', this.onDblclick.bind(this), false)
    }
    onDblclick(e) {
        let target = e.target || {}
        if (target.tagName === 'TD') {
            let col = target.cellIndex - 1
            let row = target.parentElement.rowIndex -1
            let data = this.originData[row] ? this.originData[row][col] : null
            this.emit('dblclick', row, col, data)
            if (data && data[0] === '{') {
                let obj = this.JSONParse(data);
                if (typeof obj !== 'string') {
                    this.emit('dblclick-object', row, col, obj)
                }
            }
        }
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
            // console.log('callCellValue:', cellCoord.row.index, cellCoord.column.index, data, arguments)
            if (data && data[0] === '=') {
                let result = this.parser(data.substr(1))
                if (!result.error) {
                    return done(result.result)
                }
                else {
                    console.error('FormulaParserError:', result)
                }
            }
            else if (data && data[0] === '{') {
                return done(this.JSONParse(data))
            }
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
    createTable() {
        this.table = new Handsontable(this.dom, this.getTableConfig())
        this.updateSettings();
    }
    getTableConfig() {
        let me = this;
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
            afterChange() {
                me.update();
            },
            afterSelectionEnd(row, col, row2, col2) {
                me.ready = true;
                me.emit('selection', row, col, row2, col2)
                if (row2 === row && col2 === col) {
                    me.emit('select-cell', row, col)
                }
            },
            afterUnmergeCells(cellRange) {
                let from = cellRange.from;
                let index = me.mergeCells.findIndex(v => v.row === from.row && v.col === from.col);
                if (index >= 0) {
                    me.mergeCells.splice(index, 1);
                }
                me.update()
            },
            afterSetCellMeta(row, col, key, value) {
                // console.log('cell-meta:', row, col, key, value);
                me.update()
            },
            minSpareRows: 1
        }
        let config = Object.assign({}, defaultConfig, this.options.config, {data: this.originData});
        return config;
    }
    updateSettings() {
        // 可编辑时才添加菜单
        this.table.updateSettings(this.getTableConfig());
        if (this.options.metas && this.options.metas.length > 0) {
            this.options.metas.forEach(v => {
                this.table.setCellMetaObject(v.row, v.col, v.meta);
            });
        }
    }
    insertRow(rowIndex, array) {
        this.table.alter('insert_row', rowIndex, 1);
        // this.originData.splice(rowIndex, 0, array)
        // todo：更新公式，合并单元格等信息
        array.forEach((value, col) => {
            this.table.setDataAtCell(rowIndex, col, this.stringify(value));
        })
        this.render();
    }
    deleteRow(rowIndex, deleted = 1) {
        this.table.alter('remove_row', rowIndex, deleted);
        // todo：更新公式，合并单元格等信息
        this.render();
        console.log('data', this.originData)
    }
    stringify(data) {
        switch(typeof data) {
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
    update() {
        if (this.ready) {
            console.log('change');
            this.emit('change', this.originData)
            this.emit('update', this.originData)
        }
    }
    // 重新绘制表格
    render() {
        this.table.render();
    }
    // 设置单元格数据
    setDataAtCell(row, col, value) {
        if (isObject(value)) {
            value = JSON.stringify(value)
        }
        this.table.setDataAtCell(row, col, value)
    }
    // 取得对象注释数据
    getObjectComment(obj) {
        let aliasShow = []
        let show = []
        let alias = this.options.propAlias
        for(let attr in obj) {
            if (alias && alias[attr]) {
                aliasShow.push(alias[attr] + '(' + attr + '): ' + obj[attr])
            }
            else if (!this.options.commentNeedAlias) {
                show.push(attr + ': ' + obj[attr])
            }
        }
        return aliasShow.concat(show).join('\n')
    }
    getCellProp(row, col, prop) {
        // console.log('getCellProp', row, col)
        let cellMeta = {
            comment: '',
            editor: 'text',
            renderer: this.cellRender.bind(this)
        }
        if (this.options.disabled) {
            cellMeta.editor = false
        }
        let data = this.originData[row] ? this.originData[row][col] : null
        if(data && data[0] === '{') {
            let d = this.JSONParse(data)
            if (typeof d === 'object') {
                cellMeta.comment = {value: getCellName(row, col) + '\n' + this.getObjectComment(d)}
                cellMeta.editor = ObjectEditor
                if (d.readOnly || d.disabled) {
                    cellMeta.readOnly = true;
                }
            }
        }
        else if (data && data[0] === '=') {
            cellMeta.comment = {value: data}
        }
        return cellMeta
    }
    cellRender(instance, td, row, col, prop, value, cellProperties) {
        // console.log('cellRender')
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        let data = this.originData[row] ? this.originData[row][col] : null
        let className = null
        let showValue = null
        td.setAttribute('row', row);
        td.setAttribute('col', col);
        if(data && data[0] === '{') {
            let d = this.JSONParse(data)
            if (typeof d === 'string') {
                showValue = d
            }
            else {
                className = 'object'
                if (d.className) {
                    className += ' ' + d.className;
                }
                if (this.options.objectRender) {
                    showValue = this.options.objectRender(d, row, col);
                }
                else {
                    showValue = [d.name, d.value].filter(v => typeof v !== 'undefined').join(':') 
                }
            }
        }
        else if (data && data[0] === '=') {
            let result = this.parser(data.substr(1))
            className = result.error ? 'error' : 'formula'
            showValue = result.error ? data : result.result
            // console.log('parser:', data, result)
        }
        if (className) {
            td.classList.add(className)
        }
        if (showValue !== null) {
            // console.log('showValue', showValue)
            td.innerHTML = showValue
        }
        return td
    }
    JSONParse(str) {
        try {
            return JSON.parse(str)
        }
        catch(err) {
            console.error('JSON.parse Error', err, str)
        }
        return str
    }
    // 计算公式的值
    parser(formula) {
        let alias = this.alias
        if (alias) {
            formula = formula.replace(/[^\.\s\+\-\*\/\(\)]+/g, function(word) {
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
                let rowData = this.originData[row]
                if (rowData) {
                    // console.log('rowData:', rowData)
                    let data = rowData[col]
                    if (data && data[0] === '{') {
                        data = this.JSONParse(data)
                    }
                    return data[attr] || 0
                }
                return 0
            })
        }
        catch(error) {
            return {error}
        }

        // 使用公式计算出结果
        return this.formulaParser.parse(formula)
    }
    // 取得编辑数据
    getData() {
        this.originData = this.table.getData();
        return this.originData
    }
    // 获取包含样式部分的数据
    getDataWithFormat() {
        let cell = []
        for(let i = 0; i < this.originData.length; i++) {
            let meta = this.table.getCellMetaAtRow(i);
            if (meta) {
                meta.forEach(v => {
                    if (v.className) {
                        cell.push({row: v.row, col: v.col, className: v.className.trim()})
                    }
                })
            }
        }
        let tds = [...this.dom.querySelectorAll('[rowspan][colspan]')];
        let merges = tds.map(td => {
            return {
                row: parseInt(td.getAttribute('row')),
                col: parseInt(td.getAttribute('col')),
                rowspan: parseInt(td.getAttribute('rowspan')),
                colspan: parseInt(td.getAttribute('colspan')),
            }
        });
        let data = {
            data: this.originData,
            mergeCells: merges,
            cell
        }
        return data;
    }
    // 取得单元格原始数据
    getCellOrigin(row, col) {
        return this.originData[row] ? this.originData[row][col] : null
    }
    // 取得单元格计算后数据
    getCellData(row, col) {
        let data = this.originData[row] ? this.originData[row][col] : null
        if (data && data[0] === '=') {
            let result = this.parser(data.slice(1))
            if (!result.error) {
                return result.result
            }
            return data
        }
        else if(data && data[0] === '{') {
            return this.JSONParse(data)
        }
        return data
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
const charArray = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
function getCellName(row, col) {
    let colName = ''
    while(col >= 26) {
        let number = col % 26
        colName = charArray[number] + colName
        col = parseInt((col - number) / 26, 10) - 1
    }
    colName = charArray[col] + colName
    return colName + (row + 1)
}

function isObject(data) {
    return data && typeof data === 'object' && data + '' === '[object Object]'
}

module.exports = TableEditor