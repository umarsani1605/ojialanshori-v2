const crypto = require('crypto');
const password = '@ojisuperadminsolo';
console.log(crypto.createHmac('sha384', 'wp-sha384').update(password).digest('base64'));
