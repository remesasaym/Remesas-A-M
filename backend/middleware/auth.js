
const { supabase } = require('../supabaseClient');

async function requireAuth(req, res, next) {
  try {
    console.log(`🔐 Auth check for: ${req.method} ${req.path}`);
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    console.log('🔑 Verifying token...');
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.log('❌ Invalid token:', error?.message);
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    console.log(`✅ Auth OK for user: ${data.user.email}`);
    req.user = data.user;
    next();
  } catch (e) {
    console.log('❌ Auth error:', e.message);
    return res.status(401).json({ message: 'Unauthorized: Error verifying token' });
  }
}

module.exports = { requireAuth };
