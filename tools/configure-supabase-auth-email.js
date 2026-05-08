#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const loadEnvFile = (fileName) => {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
  }
};

loadEnvFile('.env.local');
loadEnvFile('.env');

const projectRef = process.env.PROJECT_REF || 'vyhurxvvninuaoraaonq';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const mode = process.env.AUTH_EMAIL_MODE || 'smtp';

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const buildPayload = () => {
  if (mode === 'dev-autoconfirm') {
    return {
      mailer_autoconfirm: true,
    };
  }

  if (mode === 'smtp') {
    return {
      external_email_enabled: true,
      mailer_autoconfirm: false,
      mailer_secure_email_change_enabled: true,
      smtp_admin_email: required('SMTP_ADMIN_EMAIL'),
      smtp_host: required('SMTP_HOST'),
      smtp_port: required('SMTP_PORT'),
      smtp_user: required('SMTP_USER'),
      smtp_pass: required('SMTP_PASS'),
      smtp_sender_name: process.env.SMTP_SENDER_NAME || 'Herazur',
    };
  }

  throw new Error(
    `Unsupported AUTH_EMAIL_MODE "${mode}". Use "smtp" or "dev-autoconfirm".`,
  );
};

if (!accessToken) {
  console.error(
    'Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens and export it before running this script.',
  );
  process.exit(1);
}

const payload = buildPayload();

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  },
);

const text = await response.text();
if (!response.ok) {
  console.error(`Supabase Auth config update failed: ${response.status}`);
  console.error(text);
  process.exit(1);
}

console.log(`Supabase Auth email config updated for ${projectRef} in ${mode} mode.`);
