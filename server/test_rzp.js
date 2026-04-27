require('dotenv').config();
const Razorpay = require('razorpay');

const rzp = new Razorpay({
  key_id: "rzp_test_Sgp61AzkQGopgV",
  key_secret: "XxFwllh9iawb2EefrRH75l9u"
});

rzp.orders.create({ amount: 100, currency: 'INR', receipt: 'test' })
  .then(console.log)
  .catch(err => {
     console.error("FAILED", err);
  });
