export default async function handler(req, res) {
  return res.status(200).json({ message: "test ok", timestamp: new Date().toISOString() });
}
