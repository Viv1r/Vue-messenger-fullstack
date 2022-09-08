function secureMultiple() {
    let result = [];
    for (let i of arguments) {
        if (typeof(i) != 'string') {
            result.push('');
            continue;
        }
        result.push(
            i.replaceAll("'", "\\'")
            .replaceAll('"', '\\"')
            .replaceAll('`', '\\`')
        );
    }
    return result;
}

function secure(str) {
    if (!str) {
        return null;
    }
    return str.replaceAll("'", "\\'")
        .replaceAll('"', '\\"')
        .replaceAll('`', '\\`');
}

export default {
    secure, secureMultiple
};