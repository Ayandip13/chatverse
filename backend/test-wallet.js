async function test() {
  try {
    const email = `test_${Date.now()}@test.com`;
    const regRes = await fetch('http://127.0.0.1:5000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name: 'Test User', role: 'boy' })
    });
    const regData = await regRes.json();
    const token = regData.data.accessToken;

    const walletRes = await fetch('http://127.0.0.1:5000/api/v1/wallet', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const walletData = await walletRes.json();
    console.log('Wallet Response:', JSON.stringify(walletData, null, 2));
    
    const txRes = await fetch('http://127.0.0.1:5000/api/v1/wallet/transactions?limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const txData = await txRes.json();
    console.log('Transactions Response:', JSON.stringify(txData, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
