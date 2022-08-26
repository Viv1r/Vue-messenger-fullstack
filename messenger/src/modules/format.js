const SHORTSYMBOLS = ['|!.,;:\'Iil'];

function strcut(text, maxlength) {
    let length = 0, result = '';
    for (let i of text) {
        if (length > maxlength) {
            result += '...';
            break;
        }
        if (SHORTSYMBOLS.includes(i))
            length += 0.5;
        else
            length += 1;
        result += i;
    }
    return result;
}

function mask(str, pattern) {
    str = String(str);
    let result = '';
    for (let i = 0; (i < pattern.length && i < str.length); i++) {
        result += pattern[i] == '#'
            ? str[i]
            : pattern[i];
    }
    return result;
}

export default {
    mask, strcut
}