const ZKEY_SERVICE_URL = 'http://localhost:3002';
const VENDURE_SHOP_API_URL = 'http://localhost:3000/shop-api';
const CLIENT_ID = 'vendure-storefront';
const REDIRECT_URI = 'http://localhost:3001/auth/callback';

async function verifySync() {
    try {
        console.log('--- Phase 1: ZKey Registration ---');
        const unique = Math.random().toString(36).substring(7) + Date.now();
        const testEmail = `name_test_${unique}@example.com`;
        const testFirstName = `First_${unique}`;
        const testLastName = `Last_${unique}`;
        const testPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

        console.log(`Registering: ${testEmail} (${testFirstName} ${testLastName})`);
        const regRes = await fetch(`${ZKEY_SERVICE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                firstName: testFirstName,
                lastName: testLastName,
                phone: testPhone,
                clientId: CLIENT_ID
            })
        });

        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
        const userId = regData.userId;
        console.log(`User ID created: ${userId}`);

        console.log('\n--- Phase 2: OIDC Interaction ---');
        const authUrl = `${ZKEY_SERVICE_URL}/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid+profile+email&state=test-state`;
        const authRes = await fetch(authUrl, {
            redirect: 'manual'
        });
        const loginUrl = authRes.headers.get('location');
        if (!loginUrl) {
            const body = await authRes.text();
            throw new Error(`No redirect location in authorize response. Status: ${authRes.status}, Body: ${body}`);
        }
        console.log(`Login URL: ${loginUrl}`);
        const interactionId = new URL(loginUrl).searchParams.get('interactionId');
        console.log(`Interaction ID: ${interactionId}`);

        console.log('Completing login interaction...');
        const loginInteractionRes = await fetch(`${ZKEY_SERVICE_URL}/auth/interaction/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interactionId, userId })
        });
        const loginInteractionData = await loginInteractionRes.json();
        const code = new URL(loginInteractionData.redirectUri).searchParams.get('code');
        console.log(`Auth Code received: ${code}`);

        console.log('\n--- Phase 3: Token Exchange ---');
        const tokenRes = await fetch(`${ZKEY_SERVICE_URL}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI
            })
        });
        const tokens = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
        console.log('Tokens received successfully.');

        console.log('\n--- Phase 3.5: Verify ZKey Profile ---');
        const profileRes = await fetch(`${ZKEY_SERVICE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        const profileData = await profileRes.json();
        console.log('ZKey Profile Data:', JSON.stringify(profileData, null, 2));

        console.log('\n--- Phase 4: Vendure Synchronization ---');
        const authenticateMutation = {
            query: `
                mutation AuthenticateWithZKey($token: String!) {
                    authenticate(input: { zkey: { token: $token } }) {
                        __typename
                        ... on CurrentUser {
                            id
                            identifier
                        }
                    }
                }
            `,
            variables: { token: tokens.access_token }
        };

        const vendureAuthRes = await fetch(VENDURE_SHOP_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'vendure-token': '__default_channel__'
            },
            body: JSON.stringify(authenticateMutation)
        });

        const vendureAuthData = await vendureAuthRes.json();
        console.log('Vendure Auth Response:', JSON.stringify(vendureAuthData, null, 2));

        if (vendureAuthData.data?.authenticate?.__typename === 'CurrentUser') {
            const customerQuery = {
                query: `
                    query {
                        activeCustomer {
                            id
                            firstName
                            lastName
                            emailAddress
                            phoneNumber
                        }
                    }
                `
            };

            const authHeader = vendureAuthRes.headers.get('vendure-auth-token');
            const customerRes = await fetch(VENDURE_SHOP_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'vendure-token': '__default_channel__',
                    'Authorization': `Bearer ${authHeader}`
                },
                body: JSON.stringify(customerQuery)
            });
            const customerData = await customerRes.json();
            console.log('Vendure Customer Data:', JSON.stringify(customerData, null, 2));

            if (customerData.data?.activeCustomer) {
                const customer = customerData.data.activeCustomer;
                console.log(`- Email: ${customer.emailAddress}`);
                console.log(`- Name: ${customer.firstName} ${customer.lastName}`);
                console.log(`- Phone: ${customer.phoneNumber}`);

                if (customer.firstName === testFirstName && customer.lastName === testLastName) {
                    console.log('--- FINAL SUCCESS: All details correctly synchronized! ---');
                } else {
                    console.log('WARNING: Some details mismatch.');
                }
            }
        }

    } catch (error) {
        console.error('\n!!! VERIFICATION FAILED !!!');
        console.error(error.message);
    }
}

verifySync();
