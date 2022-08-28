const URL = 'api/getchats';

async function load(callback) {
    const response = await fetch(URL, {method: 'POST'});
    const data = await response.json();
    callback(data);
    console.log(data);
}

export default {
    load
}