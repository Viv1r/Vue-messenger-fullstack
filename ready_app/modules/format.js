function makeSecure(str) {
    return str.replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'")
        .replaceAll('"', '\\"')
        .replaceAll('`', '\\`');
}

function secureMultiple() {
    let result = [];
    for (let i of arguments) {
        if (typeof(i) != 'string') {
            result.push('');
            continue;
        }
        result.push(makeSecure(i));
    }
    return result;
}

function secure(str) {
    if (!str) {
        return null;
    }
    return makeSecure(str);
}

export default {
    secure, secureMultiple
};