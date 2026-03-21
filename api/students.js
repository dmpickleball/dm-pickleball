import { supabase } from './supabase.js';

export default async function handler(req, res) {
  const action = req.query.action;

  // GET all approved students
  if (req.method === 'GET' && action === 'list') {
    const { data, error } = await supabase.from('students').select('*').eq('approved', true).order('last_name', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ students: data });
  }

  // GET single student
  if (req.method === 'GET' && action === 'get') {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { data, error } = await supabase.from('students').select('*').eq('email', email.toLowerCase()).single();
    if (error) return res.status(404).json({ error: 'Student not found' });
    return res.status(200).json({ student: data });
  }

  // POST update student
  if (req.method === 'POST' && action === 'update') {
    const { email, updates } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { error } = await supabase.from('students').update(updates).eq('email', email.toLowerCase());
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST request access
  if (req.method === 'POST' && action === 'request') {
    const { email, name, phone, homeCourt } = req.body;
    if (!email || !name || !phone) return res.status(400).json({ error: 'Missing required fields' });
    const { data: existing } = await supabase.from('students').select('email').eq('email', email.toLowerCase()).single();
    if (existing) return res.status(400).json({ error: 'already_exists' });
    const { data: existingRequest } = await supabase.from('access_requests').select('id').eq('email', email.toLowerCase()).eq('status', 'pending').single();
    if (existingRequest) return res.status(400).json({ error: 'already_requested' });
    const { error } = await supabase.from('access_requests').insert({ email: email.toLowerCase(), name, phone, home_court: homeCourt || '' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST approve/deny
  if (req.method === 'POST' && action === 'approve') {
    const { requestId, email, name, phone, homeCourt, memberType, action: approveAction } = req.body;
    if (approveAction === 'deny') {
      await supabase.from('access_requests').update({ status: 'denied' }).eq('id', requestId);
      return res.status(200).json({ success: true });
    }
    const { error } = await supabase.from('students').upsert({ email: email.toLowerCase(), name, phone: phone||'', home_court: homeCourt||'', member_type: memberType||'public', approved: true });
    if (error) return res.status(500).json({ error: error.message });
    await supabase.from('access_requests').update({ status: 'approved' }).eq('id', requestId);
    return res.status(200).json({ success: true });
  }

  // POST delete student
  if (req.method === 'POST' && action === 'delete') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const { error } = await supabase.from('students').delete().eq('email', email.toLowerCase());
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // GET pending requests
  if (req.method === 'GET' && action === 'pending') {
    const { data, error } = await supabase.from('access_requests').select('*').eq('status', 'pending').order('requested_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ requests: data });
  }

  res.status(400).json({ error: 'Invalid action' });
}
