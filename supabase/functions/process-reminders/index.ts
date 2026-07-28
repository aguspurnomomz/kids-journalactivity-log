import { createClient } from '@supabase/supabase-js';

const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async () => {
  try {
    const nowISO = new Date().toISOString();
    const { data: tasks, error } = await supabase
      .from('scheduled_reminder_tasks')
      .select('*, scheduled_reminders!inner(id, scheduled_time, status)')
      .eq('status', 'pending')
      .lte('scheduled_reminders.scheduled_time', nowISO);

    if (error) throw error;

    for (const task of tasks || []) {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: FONNTE_TOKEN },
        body: new URLSearchParams({
          target: task.whatsapp_number,
          message: task.message_content,
        }),
      });

      const resJson = await response.json();

      if (resJson.status) {
        await supabase
          .from('scheduled_reminder_tasks')
          .update({ status: 'completed', sent_at: new Date().toISOString() })
          .eq('id', task.id);

        await supabase
          .from('scheduled_reminders')
          .update({ status: 'completed' })
          .eq('id', task.reminder_id);
      } else {
        await supabase
          .from('scheduled_reminder_tasks')
          .update({ status: 'failed', error_message: resJson.reason || 'Fonnte error' })
          .eq('id', task.id);

        await supabase
          .from('scheduled_reminders')
          .update({ status: 'failed' })
          .eq('id', task.reminder_id);
      }
    }

    return new Response(JSON.stringify({ processed: tasks?.length || 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});