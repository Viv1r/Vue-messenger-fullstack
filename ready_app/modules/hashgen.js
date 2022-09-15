const SYMBOLS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function rand(max) {
    max = Math.floor(max);
    return Math.floor(Math.random() * max);
}

function generate(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        let selector = rand(2);
        result += selector ? SYMBOLS[rand(SYMBOLS.length)] : rand(10);
    }
    return result;
}

export default { 
    generate
};