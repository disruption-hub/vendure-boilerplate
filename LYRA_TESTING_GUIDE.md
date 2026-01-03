# Local Testing Guide for Lyra Payment Integration

## Test Credentials (MiCuentaWeb Peru)

### Test Environment
- **API User:** `88569105`
- **API Password:** `testpassword_NSJpdOElQsM4RMu16WF89ykCViBW9ddilhEdsq02sHA2T`
- **Public Key:** `88569105:testpublickey_oHKEsiKA3i9E1JshcnIA7RktrR163DdRZYzYOWgXqwSXx`
- **HMAC Key:** `H9qtqKGBMUFzH8F0kz4ihdw3MTBb0WbpJ1TLLuRLxHZM1`
- **API Endpoint:** `https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment`
- **Script Base URL:** `https://static.lyra.com/static/js/krypton-client/V4.0`

### Production Environment
- **API User:** `88569105`
- **Public Key:** `88569105:publickey_UKrWqzlcOvfMEi4OdXuBAcGK1TaTK6izlIJZYWwHGCqkv`
- **API Endpoint:** `https://api.micuentaweb.pe/api-payment/V4/Charge/CreatePayment`
- **Script Base URL:** `https://static.lyra.com/static/js/krypton-client/V4.0`

## Setup Steps

### 1. Configure Vendure Backend

Start your Vendure backend and navigate to the Admin UI:

```bash
cd vendure-backend
npm run dev
```

Then open `http://localhost:3004/admin` and:

1. Go to **Settings** → **Payment Methods**
2. Click **Create new payment method**
3. Fill in the details:
   - **Name:** Lyra Payment (Test)
   - **Code:** `lyra-payment`
   - **Handler:** Select "Lyra / PayZen"
   - **Site ID (Username):** `88569105`
   - **Test/Prod Password:** `testpassword_NSJpdOElQsM4RMu16WF89ykCViBW9ddilhEdsq02sHA2T`
   - **Public Key:** `88569105:testpublickey_oHKEsiKA3i9E1JshcnIA7RktrR163DdRZYzYOWgXqwSXx`
   - **API Endpoint:** `https://api.micuentaweb.pe/api-payment/V4/`
4. Click **Create**

### 2. Start the Storefront

```bash
cd vendure-storefront-next
npm run dev
```

Open `http://localhost:3001`

### 3. Test the Payment Flow

1. **Add a product to cart**
2. **Go to checkout**
3. **Fill in shipping/billing information**
4. **Select "Lyra Payment" as payment method**
5. **Click "Initialize Payment Form"**
6. **The Lyra IFrame should appear**

### 4. Test Card Numbers

Use these test cards in the Lyra form:

#### Successful Payment
- **Card Number:** `4970100000000000`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVV:** `123`

#### Declined Payment
- **Card Number:** `4972000000000000`
- **Expiry:** Any future date
- **CVV:** `123`

#### 3D Secure Test
- **Card Number:** `4970101122334455`
- **Expiry:** Any future date
- **CVV:** `123`

## Troubleshooting

### IFrame Not Loading
- Check browser console for errors
- Verify the public key is correct
- Ensure `static.lyra.com` is not blocked by ad blockers

### Payment Not Creating
- Check Vendure backend logs
- Verify API credentials are correct
- Check network tab for API call to `api.micuentaweb.pe`

### Webhook Not Receiving
For local testing, the webhook won't work since Lyra can't reach `localhost`. Options:
1. Use ngrok to expose your local backend
2. Test webhook in production/staging only
3. Manually verify payment in Lyra dashboard

## Next Steps

Once local testing is successful:
1. Deploy to Railway/Vercel
2. Configure production webhook URL in Lyra dashboard
3. Test with production credentials
4. Monitor payment flow in production

## Lyra Dashboard

Access your Lyra dashboard at: https://secure.micuentaweb.pe/

You can view:
- Transaction history
- Payment details
- Webhook logs
- Test vs Production mode toggle
