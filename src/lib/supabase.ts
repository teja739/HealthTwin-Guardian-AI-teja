import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase only if credentials are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to determine if we are using Supabase or local storage fallback
export const isUsingSupabase = () => !!supabase;

// Helper to check client-side window object
const isClient = typeof window !== 'undefined';

// Local storage helper key
const LS_PREFIX = 'healthtwin_db_';

// -------------------------------------------------------------
// PROFILE API
// -------------------------------------------------------------
export async function getProfile(email: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (!error && data) return data;
  }
  
  if (isClient) {
    const saved = localStorage.getItem(`${LS_PREFIX}profile_${email}`);
    if (saved) return JSON.parse(saved);
  }
  return null;
}

export async function saveProfile(profile: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        email: profile.email,
        name: profile.name,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        blood_group: profile.bloodGroup || profile.blood_group || 'O+',
        allergies: profile.allergies || [],
        medications: profile.medications || [],
        conditions: profile.conditions || [],
        goals: profile.goals || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select();
    if (!error && data) return data[0];
  }

  if (isClient) {
    localStorage.setItem(`${LS_PREFIX}profile_${profile.email}`, JSON.stringify(profile));
  }
  return profile;
}

// -------------------------------------------------------------
// APPOINTMENTS API
// -------------------------------------------------------------
export async function getAppointments(email: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_email', email)
      .order('appointment_time', { ascending: true });
    if (!error && data) {
      return data.map(appt => ({
        id: appt.id,
        userEmail: appt.user_email,
        specialty: appt.specialty,
        doctorName: appt.doctor_name,
        hospitalName: appt.hospital_name,
        appointmentTime: appt.appointment_time,
        status: appt.status
      }));
    }
  }

  if (isClient) {
    const saved = localStorage.getItem(`${LS_PREFIX}appointments_${email}`);
    if (saved) return JSON.parse(saved);
  }
  return [];
}

export async function createAppointment(email: string, appt: any) {
  const newAppt = {
    id: appt.id || Date.now().toString(),
    userEmail: email,
    specialty: appt.specialty,
    doctorName: appt.doctorName || appt.doctor_name,
    hospitalName: appt.hospitalName || appt.hospital_name,
    appointmentTime: appt.appointmentTime || appt.appointment_time,
    status: appt.status || 'Confirmed'
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_email: email,
        specialty: newAppt.specialty,
        doctor_name: newAppt.doctorName,
        hospital_name: newAppt.hospitalName,
        appointment_time: newAppt.appointmentTime,
        status: newAppt.status
      })
      .select();
    if (!error && data) return data[0];
  }

  if (isClient) {
    const current = await getAppointments(email);
    const updated = [...current, newAppt];
    localStorage.setItem(`${LS_PREFIX}appointments_${email}`, JSON.stringify(updated));
  }
  return newAppt;
}

// -------------------------------------------------------------
// EMERGENCY CONTACTS API
// -------------------------------------------------------------
export async function getEmergencyContacts(email: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_email', email);
    if (!error && data) {
      return data.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        relation: c.relation
      }));
    }
  }

  if (isClient) {
    const saved = localStorage.getItem(`${LS_PREFIX}contacts_${email}`);
    if (saved) return JSON.parse(saved);
  }

  // Pre-populated defaults for hackathon
  return [
    { name: 'Dr. Sarah Mitchell', relation: 'Primary Physician', phone: '+1 (555) 0142' },
    { name: 'Priya (Spouse)', relation: 'Emergency Contact', phone: '+1 (555) 0198' },
    { name: 'City Hospital ER', relation: 'Nearest Hospital', phone: '911' }
  ];
}

export async function saveEmergencyContacts(email: string, contacts: any[]) {
  if (supabase) {
    // Delete existing contacts first to simplify replacement
    await supabase.from('emergency_contacts').delete().eq('user_email', email);
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert(contacts.map(c => ({
        user_email: email,
        name: c.name,
        phone: c.phone,
        relation: c.relation
      })))
      .select();
    if (!error && data) return data;
  }

  if (isClient) {
    localStorage.setItem(`${LS_PREFIX}contacts_${email}`, JSON.stringify(contacts));
  }
  return contacts;
}

// -------------------------------------------------------------
// WELLNESS LOGS API
// -------------------------------------------------------------
export interface WellnessLog {
  date: string;
  steps: number;
  waterMl: number;
  sleepHours: number;
  mood: string;
}

export async function getWellnessLogs(email: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('wellness_logs')
      .select('*')
      .eq('user_email', email)
      .order('date', { ascending: false });
    if (!error && data) {
      return data.map(log => ({
        date: log.date,
        steps: log.steps,
        waterMl: log.water_ml,
        sleepHours: log.sleep_hours,
        mood: log.mood
      }));
    }
  }

  if (isClient) {
    const saved = localStorage.getItem(`${LS_PREFIX}wellness_${email}`);
    if (saved) return JSON.parse(saved);
  }

  // Pre-populated defaults for a nice chart (7 days)
  const defaultLogs: WellnessLog[] = [];
  const now = new Date();
  const moods = ['Calm', 'Happy', 'Calm', 'Tired', 'Calm', 'Happy', 'Calm'];
  const stepsList = [8420, 10210, 7150, 9300, 11050, 6800, 9500];
  const waterList = [2200, 2500, 1800, 2000, 2400, 1500, 2100];
  const sleepList = [7.5, 8.2, 6.8, 7.2, 8.4, 7.8, 8.1];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    defaultLogs.push({
      date: dateStr,
      steps: stepsList[6 - i],
      waterMl: waterList[6 - i],
      sleepHours: sleepList[6 - i],
      mood: moods[6 - i]
    });
  }
  return defaultLogs;
}

export async function saveWellnessLog(email: string, log: WellnessLog) {
  if (supabase) {
    const { data, error } = await supabase
      .from('wellness_logs')
      .upsert({
        user_email: email,
        date: log.date,
        steps: log.steps,
        water_ml: log.waterMl,
        sleep_hours: log.sleepHours,
        mood: log.mood
      }, { onConflict: 'user_email,date' })
      .select();
    if (!error && data) return data[0];
  }

  if (isClient) {
    const current = await getWellnessLogs(email);
    const filtered = current.filter((item: any) => item.date !== log.date);
    const updated = [log, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(`${LS_PREFIX}wellness_${email}`, JSON.stringify(updated));
  }
  return log;
}

// -------------------------------------------------------------
// MEDICATION ADHERENCE LOGS API
// -------------------------------------------------------------
export async function getMedicationLogs(email: string, dateStr: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_email', email)
      .eq('date', dateStr);
    if (!error && data) {
      return data.map(log => ({
        medicineName: log.medicine_name,
        timeOfDay: log.time_of_day, // 'morning' | 'night'
        taken: log.taken,
        takenTime: log.taken_time
      }));
    }
  }

  if (isClient) {
    const saved = localStorage.getItem(`${LS_PREFIX}medlogs_${email}_${dateStr}`);
    if (saved) return JSON.parse(saved);
  }
  return [];
}

export async function saveMedicationLog(email: string, dateStr: string, medicineName: string, timeOfDay: string, taken: boolean) {
  const logItem = {
    medicineName,
    timeOfDay,
    taken,
    takenTime: taken ? new Date().toISOString() : null
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('medication_logs')
      .upsert({
        user_email: email,
        date: dateStr,
        medicine_name: medicineName,
        time_of_day: timeOfDay,
        taken,
        taken_time: logItem.takenTime
      }, { onConflict: 'user_email,date,medicine_name,time_of_day' })
      .select();
    if (!error && data) return data[0];
  }

  if (isClient) {
    const current = await getMedicationLogs(email, dateStr);
    const filtered = current.filter((item: any) => !(item.medicineName === medicineName && item.timeOfDay === timeOfDay));
    const updated = [...filtered, logItem];
    localStorage.setItem(`${LS_PREFIX}medlogs_${email}_${dateStr}`, JSON.stringify(updated));
  }
  return logItem;
}

// -------------------------------------------------------------
// FAMILY RECORDS API
// -------------------------------------------------------------
export async function getFamilyMembers(email: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_email', email);
    if (!error && data) {
      return data.map(m => ({
        id: m.id,
        name: m.name,
        relation: m.relation,
        age: m.age,
        bloodGroup: m.blood_group,
        conditions: m.conditions || [],
        medications: m.medications || [],
        avatar: m.avatar || '👤',
        healthScore: m.health_score || 90,
        risk: m.risk || 'Low'
      }));
    }
  }

  if (isClient) {
    const saved = localStorage.getItem(`${LS_PREFIX}family_${email}`);
    if (saved) return JSON.parse(saved);
  }

  // Pre-populated defaults for a family dashboard
  return [
    {
      id: 'self',
      name: 'You (Primary)',
      relation: 'Self',
      age: 32,
      avatar: '👤',
      healthScore: 88,
      risk: 'Low',
      bloodGroup: 'O+',
      conditions: ['Mild Hypertension'],
      medications: ['Lisinopril 10mg', 'Metoprolol 25mg', 'Atorvastatin 20mg'],
    },
    {
      id: 'spouse',
      name: 'Priya',
      relation: 'Spouse',
      age: 30,
      avatar: '👩',
      healthScore: 94,
      risk: 'Low',
      bloodGroup: 'A+',
      conditions: [],
      medications: ['Vitamin D3'],
    },
    {
      id: 'father',
      name: 'Rajesh',
      relation: 'Father',
      age: 62,
      avatar: '👨‍🦳',
      healthScore: 71,
      risk: 'Medium',
      bloodGroup: 'B+',
      conditions: ['Type 2 Diabetes', 'Hypertension'],
      medications: ['Metformin 500mg', 'Aspirin 81mg'],
    }
  ];
}

export async function addFamilyMember(email: string, member: any) {
  const newMember = {
    id: member.id || Date.now().toString(),
    name: member.name,
    relation: member.relation,
    age: parseInt(member.age) || 30,
    bloodGroup: member.bloodGroup || member.blood_group || 'O+',
    conditions: member.conditions || [],
    medications: member.medications || [],
    avatar: member.avatar || '👤',
    healthScore: member.healthScore || member.health_score || 90,
    risk: member.risk || 'Low'
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        user_email: email,
        name: newMember.name,
        relation: newMember.relation,
        age: newMember.age,
        blood_group: newMember.bloodGroup,
        conditions: newMember.conditions,
        medications: newMember.medications,
        avatar: newMember.avatar,
        health_score: newMember.healthScore,
        risk: newMember.risk
      })
      .select();
    if (!error && data) return data[0];
  }

  if (isClient) {
    const current = await getFamilyMembers(email);
    const updated = [...current, newMember];
    localStorage.setItem(`${LS_PREFIX}family_${email}`, JSON.stringify(updated));
  }
  return newMember;
}
