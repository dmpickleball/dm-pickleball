import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  const action = req.query.action;

  // GET all approved active students
  if (req.method === 'GET' && action === 'list') {
    const { data, error } = await supabase.from('students').select('*').eq('approved', true).neq('blocked', true).order('last_name', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ students: data });
  }

  // GET removed students (archived — email freed for re-registration)
  // Cross-references deleted_students with students table to get blocked status
  if (req.method === 'GET' && action === 'list-deleted') {
    const { data, error } = await supabase.from('deleted_students').select('*').order('deleted_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    // Find which removed students have a blocked sentinel in the students table
    const { data: blockedSentinels } = await supabase.from('students').select('email').eq('approved', false).eq('blocked', true);
    const blockedSet = new Set((blockedSentinels || []).map(b => b.email));
    const result = (data || []).map(s => ({ ...s, blocked: blockedSet.has(s.email) }));
    return res.status(200).json({ students: result });
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
    const { email, name, firstName, lastName, commEmail, phone, homeCourt, skillLevel, goals, referralSource, duprRating, authProvider } = req.body;
    if (!email || !name || !phone) return res.status(400).json({ error: 'Missing required fields' });
    const lowerEmail = email.toLowerCase();

    // Check students table for existing or blocked record
    const { data: existing } = await supabase.from('students').select('email,blocked,approved').eq('email', lowerEmail).single();
    if (existing) {
      if (existing.blocked) return res.status(400).json({ error: 'blocked' });
      return res.status(400).json({ error: 'already_exists' });
    }

    const { data: existingRequest } = await supabase.from('access_requests').select('id').eq('email', lowerEmail).eq('status', 'pending').single();
    if (existingRequest) return res.status(400).json({ error: 'already_requested' });
    const { error } = await supabase.from('access_requests').insert({
      email: lowerEmail,
      name,
      first_name: firstName || '',
      last_name: lastName || '',
      comm_email: commEmail || '',
      phone,
      home_court: homeCourt || '',
      skill_level: skillLevel || '',
      goals: goals || '',
      referral_source: referralSource || '',
      dupr_rating: duprRating || '',
      auth_provider: authProvider || 'google',
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST approve/deny
  if (req.method === 'POST' && action === 'approve') {
    const { requestId, email, name, firstName, lastName, commEmail, phone, homeCourt, skillLevel, duprRating, memberType, grandfathered, action: approveAction } = req.body;
    if (approveAction === 'deny') {
      await supabase.from('access_requests').update({ status: 'denied' }).eq('id', requestId);
      return res.status(200).json({ success: true });
    }
    const { error } = await supabase.from('students').upsert({
      email: email.toLowerCase(),
      name,
      first_name: firstName || '',
      last_name: lastName || '',
      comm_email: commEmail || '',
      phone: phone || '',
      home_court: homeCourt || '',
      skill_level: skillLevel || '',
      dupr_rating: duprRating || '',
      member_type: memberType || 'public',
      grandfathered: !!grandfathered,
      approved: true,
      blocked: false,
    });
    if (error) return res.status(500).json({ error: error.message });
    await supabase.from('access_requests').update({ status: 'approved' }).eq('id', requestId);
    return res.status(200).json({ success: true });
  }

  // POST remove student — archives profile to deleted_students, removes from students
  // This frees the email for re-registration while preserving lesson history
  if (req.method === 'POST' && action === 'delete') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const lowerEmail = email.toLowerCase();

    // Fetch current student record to archive
    const { data: student } = await supabase.from('students').select('*').eq('email', lowerEmail).single();
    if (student) {
      await supabase.from('deleted_students').upsert({
        email: lowerEmail,
        name: student.name || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        comm_email: student.comm_email || '',
        phone: student.phone || '',
        city: student.city || '',
        home_court: student.home_court || '',
        skill_level: student.skill_level || '',
        dupr_rating: student.dupr_rating || '',
        dupr_id: student.dupr_id || '',
        member_type: student.member_type || 'public',
        picture: student.picture || '',
        deleted_at: new Date().toISOString(),
      });
    }

    // Remove from students table — frees the email
    const { error } = await supabase.from('students').delete().eq('email', lowerEmail);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // POST restore student — moves from deleted_students back to students (active)
  if (req.method === 'POST' && action === 'restore') {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const lowerEmail = email.toLowerCase();

    const { data: archived } = await supabase.from('deleted_students').select('*').eq('email', lowerEmail).single();
    if (!archived) return res.status(404).json({ error: 'Not found in removed students' });

    // Remove any blocked sentinel from students table
    await supabase.from('students').delete().eq('email', lowerEmail).eq('approved', false);

    // Restore to students as active
    const { error } = await supabase.from('students').upsert({
      email: lowerEmail,
      name: archived.name || '',
      first_name: archived.first_name || '',
      last_name: archived.last_name || '',
      comm_email: archived.comm_email || '',
      phone: archived.phone || '',
      city: archived.city || '',
      home_court: archived.home_court || '',
      skill_level: archived.skill_level || '',
      dupr_rating: archived.dupr_rating || '',
      dupr_id: archived.dupr_id || '',
      member_type: archived.member_type || 'public',
      picture: archived.picture || '',
      approved: true,
      blocked: false,
    });
    if (error) return res.status(500).json({ error: error.message });

    // Remove from deleted_students
    await supabase.from('deleted_students').delete().eq('email', lowerEmail);
    return res.status(200).json({ success: true });
  }

  // POST block/unblock a removed student
  // Uses a sentinel record in students table (approved:false, blocked:true) to gate re-registration
  if (req.method === 'POST' && action === 'block-removed') {
    const { email, block } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const lowerEmail = email.toLowerCase();

    if (block) {
      // Upsert blocked sentinel — prevents re-registration
      await supabase.from('students').upsert({ email: lowerEmail, name: lowerEmail, approved: false, blocked: true });
    } else {
      // Remove the sentinel so they can re-register
      await supabase.from('students').delete().eq('email', lowerEmail).eq('approved', false);
    }
    return res.status(200).json({ success: true });
  }

  // POST dupr-lookup — fetch live DUPR rating for a player by ID
  if (req.method === 'POST' && action === 'dupr-lookup') {
    const { duprId, email } = req.body;
    if (!duprId) return res.status(400).json({ error: 'duprId required' });

    const DUPR_EMAIL = process.env.DUPR_EMAIL;
    const DUPR_PASSWORD = process.env.DUPR_PASSWORD;

    if (!DUPR_EMAIL || !DUPR_PASSWORD) {
      return res.status(200).json({ error: 'DUPR_NOT_CONFIGURED', rating: null });
    }

    try {
      // Step 1: Login — endpoint changed from /user/login to /login (confirmed Apr 2026)
      const loginRes = await fetch('https://api.dupr.gg/auth/v1.0/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: DUPR_EMAIL, password: DUPR_PASSWORD }),
      });
      if (!loginRes.ok) {
        const errText = await loginRes.text().catch(() => '');
        const hint = `(using ${DUPR_EMAIL.slice(0,3)}***@${DUPR_EMAIL.split('@')[1]||'?'})`;
        throw new Error(`DUPR login failed ${hint} (${loginRes.status}): ${errText.slice(0,120)}`);
      }
      const loginData = await loginRes.json();
      // Token may be at result.token, result.accessToken, or top-level accessToken
      const token = loginData?.result?.token || loginData?.result?.accessToken
        || loginData?.token || loginData?.accessToken;
      if (!token) throw new Error('DUPR login ok but no token found. Response keys: ' + Object.keys(loginData?.result || loginData).join(', '));

      // Step 2: Resolve alphanumeric DUPR ID → numeric userId
      const byDuprIdRes = await fetch('https://api.dupr.gg/player/search/byDuprId', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ duprId: duprId.toUpperCase() }),
      });
      if (!byDuprIdRes.ok) throw new Error(`DUPR ID lookup failed (${byDuprIdRes.status})`);
      const byDuprIdData = await byDuprIdRes.json();
      const numericUserId = byDuprIdData?.results?.[0]?.userId || byDuprIdData?.result?.userId;
      if (!numericUserId) throw new Error(`DUPR ID "${duprId}" not found. Response: ` + JSON.stringify(byDuprIdData).slice(0,200));

      // Step 3: Fetch player profile with ratings using numeric ID
      const playerRes = await fetch(`https://api.dupr.gg/player/v1.0/${numericUserId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      if (!playerRes.ok) throw new Error(`Player profile fetch failed (${playerRes.status})`);
      const playerData = await playerRes.json();

      const profile = playerData?.result || playerData;
      const ratings = profile?.ratings || {};
      // Ratings come as strings like "4.380" or "NR"
      const parseRating = (v) => {
        if (!v || v === 'NR' || v === 'null') return null;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      };
      const singlesRating = parseRating(ratings.singles);
      const doublesRating = parseRating(ratings.doubles);
      const fullName = profile?.fullName || profile?.displayName || null;

      // Auto-save to Supabase if email provided
      if (email) {
        const updates = { dupr_id: String(duprId) };
        if (singlesRating != null) updates.dupr_rating = String(parseFloat(singlesRating).toFixed(2));
        if (doublesRating != null) updates.dupr_doubles_rating = String(parseFloat(doublesRating).toFixed(2));
        await supabase.from('students').update(updates).eq('email', email.toLowerCase());
      }

      return res.status(200).json({
        rating: singlesRating,
        doublesRating,
        fullName,
        raw: profile,
      });
    } catch (err) {
      return res.status(200).json({ error: err.message, rating: null });
    }
  }

  // GET pending requests
  if (req.method === 'GET' && action === 'pending') {
    const { data, error } = await supabase.from('access_requests').select('*').eq('status', 'pending').order('requested_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ requests: data });
  }

  res.status(400).json({ error: 'Invalid action' });
}
