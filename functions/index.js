const express = require("express");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();

app.use(cors({
  origin: [
    "https://belucky-d9520.web.app",
    "https://belucky-d9520.firebaseapp.com"
  ]
}));

app.use(express.json());

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay environment variables are missing");
  }

  return new Razorpay({ key_id, key_secret });
}

app.get("/", (req, res) => {
  res.send("beLucky payment API is running");
});

app.post("/create-order", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    // Amount is in paise. Limit this endpoint to safe test amounts.
    if (!Number.isInteger(amount) || amount < 100 || amount > 100000) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: "bl_" + crypto.randomUUID()
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Create order failed:", error.message);
    res.status(500).json({ error: "Unable to create payment order" });
  }
});


app.post("/verify-payment", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({
      verified: false,
      error: "Missing payment details"
    });
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("Missing Razorpay secret");
    }

    // Verify payment signature
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const actualBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return res.status(400).json({
        verified: false,
        error: "Invalid signature"
      });
    }

    // Fetch payment details directly from Razorpay
    const razorpay = getRazorpay();

    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        verified: false,
        error: "Payment not captured or details do not match"
      });
    }

    // Fetch order and compare amounts
    const order = await razorpay.orders.fetch(
      razorpay_order_id
    );

    if (
      order.status !== "paid" ||
      payment.amount !== order.amount
    ) {
      return res.status(400).json({
        verified: false,
        error: "Payment amount or order status mismatch"
      });
    }

    return res.json({
      verified: true,
      orderId: order.id,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency
    });

  } catch (error) {
    console.error(
      "Payment verification failed:",
      error.message
    );

    return res.status(500).json({
      verified: false,
      error: "Verification failed"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`beLucky payment API listening on port ${PORT}`);
});