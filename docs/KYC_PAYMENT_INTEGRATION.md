# 🔐 KYC & Payment Corridor Integration Guide

## 📋 Overview

This guide covers the integration of:

- **Sumsub** for KYC (Know Your Customer) verification
- **Thunes** for payment processing and remittances

---

## 🔑 Step 1: Get API Credentials

### Sumsub (KYC)

1. Go to [Sumsub Dashboard](https://cockpit.sumsub.com/)
2. Sign up for a free sandbox account
3. Navigate to **Settings** → **API Keys**
4. Create a new API key and save:
   - `App Token`
   - `Secret Key`
5. Create a verification level (e.g., "basic-kyc-level") in **Levels** section

### Thunes (Payment Corridor)

1. Go to [Thunes Developer Portal](https://developers.thunes.com/)
2. Request sandbox access
3. Once approved, get your credentials:
   - `API Key`
   - `API Secret`
4. Review available corridors for your target countries

---

## ⚙️ Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Sumsub KYC
SUMSUB_APP_TOKEN=your_app_token_here
SUMSUB_SECRET_KEY=your_secret_key_here
SUMSUB_BASE_URL=https://api.sumsub.com
SUMSUB_LEVEL_NAME=basic-kyc-level

# Thunes Payment Corridor
THUNES_API_KEY=your_api_key_here
THUNES_API_SECRET=your_api_secret_here
THUNES_BASE_URL=https://api-sandbox.thunes.com
THUNES_ENV=sandbox
```

**⚠️ Important**: Never commit `.env` to git. Add it to `.gitignore`.

---

## 🚀 Step 3: Backend Integration

### Add to `backend/server.ts`

```typescript
import { kycService } from '../services/kycService';
import { paymentCorridorService } from '../services/paymentCorridorService';

// KYC Endpoints
app.post('/api/kyc/start-verification', async (req, res) => {
  try {
    const { userId, email, phone, firstName, lastName } = req.body;
    
    const result = await kycService.createAccessToken({
      userId,
      email,
      phone,
      firstName,
      lastName,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start KYC verification' });
  }
});

app.get('/api/kyc/status/:applicantId', async (req, res) => {
  try {
    const { applicantId } = req.params;
    const status = await kycService.getVerificationStatus(applicantId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

app.post('/api/kyc/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-payload-digest'] as string;
    await kycService.handleWebhook(req.body, signature);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payment Endpoints
app.post('/api/payments/send-remittance', async (req, res) => {
  try {
    const remittanceData = req.body;
    const result = await paymentCorridorService.sendRemittance(remittanceData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send remittance' });
  }
});

app.get('/api/payments/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const status = await paymentCorridorService.getTransactionStatus(transactionId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get transaction status' });
  }
});

app.get('/api/payments/payout-methods', async (req, res) => {
  try {
    const { sourceCountry, destinationCountry, currency } = req.query;
    const methods = await paymentCorridorService.getAvailablePayoutMethods(
      sourceCountry as string,
      destinationCountry as string,
      currency as string
    );
    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payout methods' });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-thunes-signature'] as string;
    await paymentCorridorService.handleWebhook(req.body, signature);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

---

## 🎨 Step 4: Frontend Integration

### Update `components/Profile.tsx` for KYC

```typescript
const handleStartKYC = async () => {
  try {
    const response = await fetch('/api/kyc/start-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.fullName?.split(' ')[0],
        lastName: user.fullName?.split(' ').slice(1).join(' '),
      }),
    });

    const data = await response.json();
    
    if (data.success && data.verificationUrl) {
      // Open Sumsub verification in new window or iframe
      window.open(data.verificationUrl, '_blank');
    }
  } catch (error) {
    console.error('Failed to start KYC:', error);
  }
};
```

### Update `components/Calculator.tsx` for real payments

```typescript
const handleConfirmSend = async () => {
  setIsSubmitting(true);
  try {
    const response = await fetch('/api/payments/send-remittance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user.id,
        senderName: user.fullName,
        senderCountry: fromCountryCode,
        recipientName,
        recipientCountry: toCountryCode,
        recipientBank,
        recipientAccountNumber: recipientAccount,
        recipientPhone: recipientId,
        amount: parseFloat(amount),
        currency: fromCurrency,
        purpose: 'family_support',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      setTransactionId(data.transactionId);
      setStep(4); // Success screen
    } else {
      setSubmissionError(data.error);
      setStep(5); // Error screen
    }
  } catch (error) {
    setSubmissionError('Failed to process payment');
    setStep(5);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 🔔 Step 5: Configure Webhooks

### Sumsub Webhook

1. Go to Sumsub Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/kyc/webhook`
3. Select events: `applicantReviewed`, `applicantPending`

### Thunes Webhook

1. Contact Thunes support to configure webhook
2. Provide URL: `https://your-domain.com/api/payments/webhook`
3. Events: `transaction.completed`, `transaction.failed`

---

## 🧪 Step 6: Testing

### Test KYC Flow

```bash
# Start verification
curl -X POST http://localhost:3000/api/kyc/start-verification \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'

# Check status
curl http://localhost:3000/api/kyc/status/mock-test-user-123
```

### Test Payment Flow

```bash
# Send remittance
curl -X POST http://localhost:3000/api/payments/send-remittance \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "user-123",
    "senderName": "John Doe",
    "senderCountry": "US",
    "recipientName": "Jane Doe",
    "recipientCountry": "VE",
    "recipientAccountNumber": "1234567890",
    "amount": 100,
    "currency": "USD"
  }'

# Check transaction status
curl http://localhost:3000/api/payments/status/mock-txn-123456789
```

---

## 📊 Step 7: Database Schema Updates

Add to Supabase:

```sql
-- Add KYC fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_applicant_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_completed_at TIMESTAMP;

-- Add payment provider fields to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_status TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10, 4);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_fees DECIMAL(10, 2);
```

---

## 🎯 Next Steps

1. **Get credentials** from Sumsub and Thunes
2. **Configure `.env`** with API keys
3. **Test in sandbox** mode
4. **Update database** schema
5. **Deploy webhooks** to production
6. **Go live** 🚀

---

## 💰 Pricing Estimates

### Sumsub

- **Sandbox**: Free
- **Production**: $0.50-2.00 per verification
- **Volume discounts**: Available for 10k+ verifications/month

### Thunes

- **Sandbox**: Free
- **Production**: 1.5-2.5% per transaction
- **Setup fee**: Usually waived for startups
- **Monthly minimum**: Varies by volume

---

## 📚 Resources

- [Sumsub Docs](https://developers.sumsub.com/)
- [Thunes Docs](https://developers.thunes.com/)
- [Sumsub SDK](https://github.com/SumSubstance/IdensicMobileSDK-iOS)
- [Thunes Postman Collection](https://www.postman.com/thunes-api/)

---

## ⚠️ Important Notes

1. **Never expose API keys** in frontend code
2. **Always validate** webhook signatures
3. **Log all transactions** for compliance
4. **Test thoroughly** in sandbox before production
5. **Monitor** transaction success rates
6. **Have fallback** payment methods ready

---

## 🆘 Support

- **Sumsub**: <support@sumsub.com>
- **Thunes**: <support@thunes.com>
- **Our team**: [Your contact info]
