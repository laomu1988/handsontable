/**
 * @file 公共函数
 */

module.exports = {
    JSONParse: JSONParse,
    formatDateTime: formatDateTime
};

function JSONParse(str) {
    try {
        return JSON.parse(str);
    } catch (err) {
        console.error('JSON.parse Error', err, str);
    }
    return str;
}

function formatDateTime(date) {
    date = date || new Date();
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    var d = date.getDate();
    d = d < 10 ? '0' + d : d;
    var h = date.getHours();
    h = h < 10 ? '0' + h : h;
    var minute = date.getMinutes();
    minute = minute < 10 ? '0' + minute : minute;
    var second = date.getSeconds();
    second = second < 10 ? '0' + second : second;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
};