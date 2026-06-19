import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import * as nodemailer from "nodemailer";

interface SmtpConfig {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
}

interface RecipientItem {
  contact_id: string;
  template_id?: string;
  subject?: string;
  body?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface Contact {
  id: string;
  customer_id: string;
  name: string | null;
  email: string | null;
}

interface RecipientResult {
  contact_id: string;
  success: boolean;
  error?: string;
}

async function getSmtpConfig(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<SmtpConfig | null> {
  const { data, error } = await supabase
    .from("smtp_config")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as SmtpConfig;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get SMTP config
  const smtpConfig = await getSmtpConfig(supabase);
  if (!smtpConfig) {
    return NextResponse.json(
      { error: "SMTP not configured" },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.smtp_host || "smtp.gmail.com",
    port: smtpConfig.smtp_port || 587,
    secure: smtpConfig.smtp_port === 465,
    auth: {
      user: smtpConfig.smtp_user,
      pass: smtpConfig.smtp_password,
    },
  });

  let body: { recipients?: RecipientItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { recipients } = body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json(
      { error: "recipients must be a non-empty array" },
      { status: 400 }
    );
  }

  // Collect all unique template IDs to fetch in one query
  const templateIds = [
    ...new Set(
      recipients
        .filter((r) => r.template_id)
        .map((r) => r.template_id!)
    ),
  ];

  // Fetch templates if any
  let templatesMap: Map<string, Template> = new Map();
  if (templateIds.length > 0) {
    const { data: templates, error: templatesError } = await supabase
      .from("email_templates")
      .select("*")
      .in("id", templateIds);

    if (templatesError) {
      return NextResponse.json(
        { error: `Failed to fetch templates: ${templatesError.message}` },
        { status: 500 }
      );
    }

    if (templates) {
      for (const tpl of templates) {
        templatesMap.set(tpl.id, tpl as Template);
      }
    }
  }

  // Fetch all contacts in one query
  const contactIds = recipients.map((r) => r.contact_id);
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id, customer_id, name, email")
    .in("id", contactIds);

  if (contactsError) {
    return NextResponse.json(
      { error: `Failed to fetch contacts: ${contactsError.message}` },
      { status: 500 }
    );
  }

  const contactsMap = new Map<string, Contact>();
  if (contacts) {
    for (const c of contacts) {
      contactsMap.set(c.id, c as Contact);
    }
  }

  const results: RecipientResult[] = [];

  for (const recipient of recipients) {
    const contact = contactsMap.get(recipient.contact_id);

    if (!contact) {
      results.push({
        contact_id: recipient.contact_id,
        success: false,
        error: "Contact not found",
      });
      continue;
    }

    if (!contact.email) {
      results.push({
        contact_id: recipient.contact_id,
        success: false,
        error: "Contact has no email",
      });
      // Log failed
      await supabase.from("outreach_log").insert({
        customer_id: contact.customer_id,
        contact_id: contact.id,
        template_id: recipient.template_id || null,
        channel: "email",
        direction: "outbound",
        subject: recipient.subject || "(no subject)",
        content: recipient.body || "(no body)",
        status: "failed",
      });
      continue;
    }

    // Determine subject and body
    let finalSubject: string;
    let finalBody: string;
    const template = recipient.template_id
      ? templatesMap.get(recipient.template_id)
      : undefined;

    if (recipient.subject) {
      finalSubject = recipient.subject;
    } else if (template) {
      finalSubject = template.subject;
    } else {
      results.push({
        contact_id: recipient.contact_id,
        success: false,
        error: "No subject provided and no template found",
      });
      continue;
    }

    if (recipient.body) {
      finalBody = recipient.body;
    } else if (template) {
      finalBody = template.body;
    } else {
      results.push({
        contact_id: recipient.contact_id,
        success: false,
        error: "No body provided and no template found",
      });
      continue;
    }

    // Send email
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${smtpConfig.from_name || "TradeCRM"}" <${smtpConfig.smtp_user}>`,
        to: contact.name
          ? `${contact.name} <${contact.email}>`
          : contact.email,
        subject: finalSubject.trim(),
        text: finalBody.trim(),
      };

      await transporter.sendMail(mailOptions);

      results.push({
        contact_id: recipient.contact_id,
        success: true,
      });

      // Log successful outreach
      await supabase.from("outreach_log").insert({
        customer_id: contact.customer_id,
        contact_id: contact.id,
        template_id: recipient.template_id || null,
        channel: "email",
        direction: "outbound",
        subject: finalSubject.trim(),
        content: finalBody.trim(),
        status: "sent",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown email error";
      console.error(
        `Failed to send email to ${contact.email}:`,
        errorMessage
      );

      results.push({
        contact_id: recipient.contact_id,
        success: false,
        error: errorMessage,
      });

      // Log failed outreach
      await supabase.from("outreach_log").insert({
        customer_id: contact.customer_id,
        contact_id: contact.id,
        template_id: recipient.template_id || null,
        channel: "email",
        direction: "outbound",
        subject: finalSubject.trim(),
        content: finalBody.trim(),
        status: "failed",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: true,
    total: recipients.length,
    success_count: successCount,
    fail_count: failCount,
    results,
  });
}
