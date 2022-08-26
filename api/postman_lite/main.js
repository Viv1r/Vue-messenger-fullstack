function getByID(id) {
    return document.getElementById(String(id));
}

const address = getByID('address'),
      body = getByID('reqbody'),
      response = getByID('response'),
      sendbutton = getByID('send');

address.value = localStorage.getItem('address') || '';
body.value = localStorage.getItem('body') || '';

address.addEventListener('input', e => localStorage.setItem('address', address.value));
body.addEventListener('input', e => localStorage.setItem('body', body.value));

sendbutton.addEventListener('click', async e => {
    e.preventDefault();
    let URL = 'http://' + address.value;
    let req = body.value;
    response.value = 'Loading...';
    await fetch(URL, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.parse(req || '{}'))
    })
    .then(data => data.json())
    .then(result => {
        response.value = JSON.stringify(result, null, 4);
    });
});