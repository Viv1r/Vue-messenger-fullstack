const URL = 'api/getchats';

async function load(callback) {
    await fetch(URL, {
        method: 'POST'
    })
    .then(data => data.json())
    .then(result => {
        callback(result);
        console.log(result);
    });
}

export default {
    load
}