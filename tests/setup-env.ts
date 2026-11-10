// Point the app's lazy Prisma client at the disposable test DB and give it a Paystack secret.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.PAYSTACK_SECRET_KEY = "sk_test_unit_secret";
