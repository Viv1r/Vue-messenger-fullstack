function makeSecure(str) {
    return str.replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/`/g, '\\`');
}

function secure() {
    let result = [];
    for (let i of arguments) {
        if (typeof(i) != 'string') {
            result.push('');
            continue;
        }
        result.push(makeSecure(i));
    }
    return result.length == 1
        ? result[0]
        : result;
}

export default {
    secure
};