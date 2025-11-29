// backend/supabaseClient.js
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.warn('Supabase URL/Service Role key not set. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables.')
}

const supabase = createClient(supabaseUrl || '', serviceKey || '')

module.exports = { supabase }