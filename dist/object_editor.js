var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * 对象编辑
 */

var Handsontable = require('handsontable/dist/handsontable.full.min.js');

var ObjectEditor = function (_Handsontable$editors) {
    _inherits(ObjectEditor, _Handsontable$editors);

    function ObjectEditor() {
        _classCallCheck(this, ObjectEditor);

        return _possibleConstructorReturn(this, (ObjectEditor.__proto__ || Object.getPrototypeOf(ObjectEditor)).apply(this, arguments));
    }

    _createClass(ObjectEditor, [{
        key: 'getValue',
        value: function getValue() {
            var value = this.TEXTAREA.value;
            var type = _typeof(this.origin);
            if (type === 'string' || type === 'number') {
                return value;
            } else if (type === 'undefind' || !this.origin) {
                return value;
            } else {
                this.origin.value = value;
                var str = JSON.stringify(this.origin);
                console.log('getValue:', value, this.origin, str);
                this.TEXTAREA.value = str;
                this.origin = '';
                return str;
            }
        }
    }, {
        key: 'setValue',
        value: function setValue(value) {
            console.log('setValue:', value, typeof value === 'undefined' ? 'undefined' : _typeof(value));
            this.origin = value;
            if (typeof value === 'string' && value[0] === '{') {
                try {
                    this.origin = JSON.parse(value);
                } catch (err) {
                    console.log('err:', err);
                }
            }
            var type = _typeof(this.origin);
            if (type === 'string' || type === 'number') {
                this.TEXTAREA.value = this.origin;
            } else if (type === 'undefind' || !this.origin) {
                this.origin = '';
                this.TEXTAREA.value = '';
            } else {
                this.TEXTAREA.value = this.origin.value;
            }
        }
    }]);

    return ObjectEditor;
}(Handsontable.editors.TextEditor);

module.exports = ObjectEditor;