import crypto from 'node:crypto';
const password = '@ojisuperadminsolo';
console.log('Node:', crypto.createHmac('sha384', 'wp-sha384').update(password).digest('base64'));
