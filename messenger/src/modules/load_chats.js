const URL = 'getchats';

async function load(callback) {
    const response = await fetch(URL, {method: 'POST'});
    const data = await response.json();
    callback(data);
}

export default {
    load
}