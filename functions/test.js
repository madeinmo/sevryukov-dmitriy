const { handler } = require('./index.js');

async function test() {
    const event = {
        httpMethod: 'POST',
        isBase64Encoded: false,
        body: JSON.stringify({
            name: 'Тест Тестов',
            phone: '+7 (999) 123-45-67',
            service: 'Консультация'
        })
    };

    console.log('Testing Cloud Function locally (without sending email)...');
    
    // We expect it to fail or log error if SMTP is not configured, but the handler will return 500
    // If it returns 500 because of missing SMTP credentials, it means the logic before it worked.
    const result = await handler(event, {});
    console.log('Result:', result);
}

test();
