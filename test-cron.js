import handler from './api/cron/sunday-sermon.js';

const mockReq = { body: {} };
const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`\n✅ Response ${code}:`);
      console.log(JSON.stringify(data, null, 2));
    },
  }),
};

try {
  await handler(mockReq, mockRes);
} catch (err) {
  console.error('❌ Handler error:', err.message);
  console.error(err.stack);
}
