/**
 * 对象编辑
 */

const Handsontable = require('handsontable/dist/handsontable.full.min.js')

class ObjectEditor extends Handsontable.editors.TextEditor {
    getValue() {
        let value = this.TEXTAREA.value;
        let type = typeof this.origin;
        if (type === 'string' || type === 'number') {
            return value;
        }
        else if (type === 'undefind' || !this.origin) {
            return value;
        }
        else {
            this.origin.value = value;
            let str = JSON.stringify(this.origin);
            console.log('getValue:', value, this.origin, str);
            this.TEXTAREA.value = str;
            this.origin = '';
            return str;
        }
    }
    setValue(value) {
        console.log('setValue:', value, typeof value);
        this.origin = value;
        if (typeof value === 'string' && value[0] === '{') {
            try {
                this.origin = JSON.parse(value);
            }
            catch(err) {
                console.log('err:', err);
            }
        }
        let type = typeof this.origin;
        if (type === 'string' || type === 'number') {
            this.TEXTAREA.value = this.origin;
        }
        else if (type === 'undefind' || !this.origin) {
            this.origin = '';
            this.TEXTAREA.value = '';
        }
        else {
            this.TEXTAREA.value = this.origin.value;
        }
    }
}

module.exports = ObjectEditor;