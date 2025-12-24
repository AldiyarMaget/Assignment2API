const axios = require('axios');

(async () => {
    try {
        const res = await axios.get('https://randomuser.me/api/', { timeout: 15000 });
        console.log('STATUS', res.status);
        console.log('LEN', res.data ? JSON.stringify(res.data).length : 0);
    } catch (err) {
        console.error('ERR CODE:', err.code);
        console.error('ERR MSG:', err.message);
        if (err.response) {
            console.error('STATUS:', err.response.status, err.response.data);
        }
        console.error(err.stack);
    }
})();
