import { supabase } from './supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { requestId, email, name, phone, homeCourt, memberType, action } = req.body;

  if (action === 'deny') {
    await supabase.from('access_requests').update({ status: 'denied' }).eq('id', requestId);
    return res.status(200).json({ success: true });
  }

  // Approve - create student
  const { error: studentError } = await supabase
    .from('students')
    .upsert({ email: email.toLowerCase(), name, phone: phone||'', home_court: homeCourt||'', member_type: memberType||'public', approved: true });
  if (studentError) return res.status(500).json({ error: studentError.message });

  // Update request status
  await supabase.from('access_requests').update({ status: 'approved' }).eq('id', requestId);
  res.status(200).json({ success: true });
}
